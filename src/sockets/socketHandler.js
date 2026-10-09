import { socketAuthMiddleware } from './socketAuth.js';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';
import * as messageService from '../services/messageService.js';

const onlineUsers = new Map();

export const initSocket = (io) => {
  
  io.use(socketAuthMiddleware);

  io.on('connection', async (socket) => {
    const user = socket.user;
    const userId = user._id.toString();

if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

socket.join(`user_${userId}`);
    socket.emit('users:online_list', Array.from(onlineUsers.keys()));

if (onlineUsers.get(userId).size === 1) {
      await User.findByIdAndUpdate(userId, { online: true });
      io.emit('user:online', {
        userId,
        online: true,
        fullName: user.fullName,
      });
    }

socket.on('conversation:join', async ({ conversationId }) => {
      try {
        if (!conversationId) return;

const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
        });

        if (conversation) {
          socket.join(`conversation_${conversationId}`);
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

socket.on('conversation:leave', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conversation_${conversationId}`);
      }
    });

socket.on('typing:start', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conversation_${conversationId}`).emit('typing:start', {
          conversationId,
          userId,
          fullName: user.fullName,
        });
      }
    });

socket.on('typing:stop', ({ conversationId }) => {
      if (conversationId) {
        socket.to(`conversation_${conversationId}`).emit('typing:stop', {
          conversationId,
          userId,
        });
      }
    });

socket.on('message:send', async (data, callback) => {
      try {
        const {
          conversationId,
          messageType,
          text,
          mediaUrl,
          mediaMeta,
          location,
          contact,
          replyTo,
          forwardedFrom,
        } = data;

        const result = await messageService.createMessage({
          conversationId,
          senderId: userId,
          messageType,
          text,
          mediaUrl,
          mediaMeta,
          location,
          contact,
          replyTo,
          forwardedFrom,
        });

io.to(`conversation_${conversationId}`).emit('message:new', result.message);

result.conversation.participants.forEach((pId) => {
          io.to(`user_${pId.toString()}`).emit('conversation:updated', {
            conversationId,
            lastMessage: result.message,
          });
        });

        if (typeof callback === 'function') {
          callback({ success: true, data: result.message });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ success: false, message: err.message, error: err });
        }
        socket.emit('error', { message: err.message });
      }
    });

socket.on('message:delivered', async ({ messageId, conversationId }) => {
      try {
        io.to(`conversation_${conversationId}`).emit('message:delivered', {
          messageId,
          conversationId,
          userId,
          deliveredAt: new Date(),
        });
        const conv = await Conversation.findById(conversationId).select('participants');
        if (conv && Array.isArray(conv.participants)) {
          conv.participants.forEach((pId) => {
            io.to(`user_${pId.toString()}`).emit('message:delivered', {
              messageId,
              conversationId,
              userId,
              deliveredAt: new Date(),
            });
          });
        }
      } catch (err) {
        console.error('Delivered event error:', err.message);
      }
    });

socket.on('message:read', async ({ conversationId }, callback) => {
      try {
        const result = await messageService.markMessagesAsRead(conversationId, userId);
        io.to(`conversation_${conversationId}`).emit('message:read', result);
        const conv = await Conversation.findById(conversationId).select('participants');
        if (conv && Array.isArray(conv.participants)) {
          conv.participants.forEach((pId) => {
            io.to(`user_${pId.toString()}`).emit('message:read', result);
          });
        }

        if (typeof callback === 'function') {
          callback({ success: true, data: result });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ success: false, message: err.message });
        }
      }
    });

socket.on('message:edit', async ({ messageId, text }, callback) => {
      try {
        const updated = await messageService.editMessage(messageId, userId, text);
        io.to(`conversation_${updated.conversationId}`).emit('message:edit', updated);

        if (typeof callback === 'function') {
          callback({ success: true, data: updated });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ success: false, message: err.message });
        }
      }
    });

socket.on('message:delete', async ({ messageId }, callback) => {
      try {
        const deleted = await messageService.deleteForEveryone(messageId, userId);
        io.to(`conversation_${deleted.conversationId}`).emit('message:delete', {
          messageId: deleted._id,
          conversationId: deleted.conversationId,
          deletedForEveryone: true,
        });

        if (typeof callback === 'function') {
          callback({ success: true, data: deleted });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ success: false, message: err.message });
        }
      }
    });

socket.on('message:reaction', async ({ messageId, emoji }, callback) => {
      try {
        const updated = await messageService.reactToMessage(messageId, userId, emoji);
        io.to(`conversation_${updated.conversationId}`).emit('message:reaction', {
          messageId: updated._id,
          conversationId: updated.conversationId,
          reactions: updated.reactions,
        });

        if (typeof callback === 'function') {
          callback({ success: true, data: updated });
        }
      } catch (err) {
        if (typeof callback === 'function') {
          callback({ success: false, message: err.message });
        }
      }
    });

    // Call Signaling & WebRTC Events
    const resolveTargetUserId = async (toUserId, conversationId) => {
      let targetId = toUserId?.toString();
      if ((!targetId || targetId === userId) && conversationId) {
        try {
          const conv = await Conversation.findById(conversationId).select('participants');
          if (conv && Array.isArray(conv.participants)) {
            const other = conv.participants.find((p) => p.toString() !== userId);
            if (other) {
              targetId = other.toString();
            }
          }
        } catch (e) {
          console.warn('[Call] Failed to resolve targetId from conversation:', e.message);
        }
      }
      return targetId && targetId !== userId ? targetId : null;
    };

    socket.on('call:start', async ({ toUserId, conversationId, callType, callerName, callerAvatar }) => {
      const targetId = await resolveTargetUserId(toUserId, conversationId);
      if (!targetId) {
        console.warn(`[Call] Call rejected: Could not determine valid recipient for conversation ${conversationId}`);
        return;
      }

      const payload = {
        fromUserId: userId,
        callerName: callerName || user.fullName,
        callerAvatar: callerAvatar || user.profileImage?.url,
        conversationId,
        callType: callType || 'audio',
      };

      console.log(`[Call] Emitting incoming call from ${userId} (${payload.callerName}) to recipient ${targetId}`);

      io.to(`user_${targetId}`).emit('call:incoming', payload);
      const recipientSockets = onlineUsers.get(targetId);
      if (recipientSockets) {
        recipientSockets.forEach((sId) => {
          io.to(sId).emit('call:incoming', payload);
        });
      }
    });

    socket.on('call:accept', async ({ toUserId, conversationId }) => {
      const targetId = await resolveTargetUserId(toUserId, conversationId);
      if (!targetId) return;

      const payload = { conversationId, fromUserId: userId };
      io.to(`user_${targetId}`).emit('call:connected', payload);
      const callerSockets = onlineUsers.get(targetId);
      if (callerSockets) {
        callerSockets.forEach((sId) => {
          io.to(sId).emit('call:connected', payload);
        });
      }
    });

    socket.on('call:reject', async ({ toUserId, conversationId }) => {
      const targetId = await resolveTargetUserId(toUserId, conversationId);
      if (!targetId) return;

      const payload = { conversationId, fromUserId: userId };
      io.to(`user_${targetId}`).emit('call:rejected', payload);
      const callerSockets = onlineUsers.get(targetId);
      if (callerSockets) {
        callerSockets.forEach((sId) => {
          io.to(sId).emit('call:rejected', payload);
        });
      }
    });

    socket.on('call:end', async ({ toUserId, conversationId }) => {
      const targetId = await resolveTargetUserId(toUserId, conversationId);
      if (targetId) {
        const payload = { conversationId, fromUserId: userId };
        io.to(`user_${targetId}`).emit('call:ended', payload);
        const otherSockets = onlineUsers.get(targetId);
        if (otherSockets) {
          otherSockets.forEach((sId) => {
            io.to(sId).emit('call:ended', payload);
          });
        }
      }
    });

    // WebRTC Peer-to-Peer Signaling (Audio / Video streams)
    socket.on('webrtc:offer', async ({ toUserId, conversationId, sdp }) => {
      const targetId = await resolveTargetUserId(toUserId, conversationId);
      if (!targetId) return;
      const payload = { fromUserId: userId, conversationId, sdp };
      io.to(`user_${targetId}`).emit('webrtc:offer', payload);
      const otherSockets = onlineUsers.get(targetId);
      if (otherSockets) {
        otherSockets.forEach((sId) => io.to(sId).emit('webrtc:offer', payload));
      }
    });

    socket.on('webrtc:answer', async ({ toUserId, conversationId, sdp }) => {
      const targetId = await resolveTargetUserId(toUserId, conversationId);
      if (!targetId) return;
      const payload = { fromUserId: userId, conversationId, sdp };
      io.to(`user_${targetId}`).emit('webrtc:answer', payload);
      const otherSockets = onlineUsers.get(targetId);
      if (otherSockets) {
        otherSockets.forEach((sId) => io.to(sId).emit('webrtc:answer', payload));
      }
    });

    socket.on('webrtc:ice-candidate', async ({ toUserId, conversationId, candidate }) => {
      const targetId = await resolveTargetUserId(toUserId, conversationId);
      if (!targetId) return;
      const payload = { fromUserId: userId, conversationId, candidate };
      io.to(`user_${targetId}`).emit('webrtc:ice-candidate', payload);
      const otherSockets = onlineUsers.get(targetId);
      if (otherSockets) {
        otherSockets.forEach((sId) => io.to(sId).emit('webrtc:ice-candidate', payload));
      }
    });

    socket.on('webrtc:ready', async ({ toUserId, conversationId }) => {
      const targetId = await resolveTargetUserId(toUserId, conversationId);
      if (!targetId) return;
      const payload = { fromUserId: userId, conversationId };
      io.to(`user_${targetId}`).emit('webrtc:ready', payload);
      const otherSockets = onlineUsers.get(targetId);
      if (otherSockets) {
        otherSockets.forEach((sId) => io.to(sId).emit('webrtc:ready', payload));
      }
    });

    socket.on('disconnect', async () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          const lastSeen = new Date();
          await User.findByIdAndUpdate(userId, {
            online: false,
            lastSeen,
          });

          io.emit('user:offline', {
            userId,
            online: false,
            lastSeen,
          });
        }
      }
    });
  });
};
