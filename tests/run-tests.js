import assert from 'assert';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import Message from '../src/models/Message.js';

let userA = null;
let userAToken = null;
let userB = null;
let userBToken = null;
let userC = null;
let userCToken = null;
let conversationId = null;
let messageId = null;
let statusId = null;
let groupId = null;
let communityId = null;

const runTests = async () => {
  console.log('\n🧪 STARTING WHATSAPP BACKEND TEST SUITE...\n');
  let passedCount = 0;
  let failedCount = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failedCount++;
    }
  };

  try {
    // 0. Setup DB
    await connectDB('memory');

    // 1. Test Signup User A
    await test('1. Signup: Register new user (User A)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          fullName: 'Alice Walker',
          email: 'alice@example.com',
          password: 'Password123!',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.strictEqual(res.body.data.user.email, 'alice@example.com');
      assert.strictEqual(res.body.data.user.password, undefined); // Password never exposed
      userA = res.body.data.user;
      userAToken = res.body.data.token;
    });

    // 2. Test Duplicate Email Signup (Case Insensitive)
    await test('2. Signup: Duplicate email registration fails (case-insensitive)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          fullName: 'Alice Duplicate',
          email: 'ALICE@EXAMPLE.COM',
          password: 'AnotherPassword123!',
        });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('already exists'));
    });

    // 3. Register User B and User C
    await test('3. Signup: Register User B and User C', async () => {
      const resB = await request(app)
        .post('/api/auth/signup')
        .send({
          fullName: 'Bob Smith',
          email: 'bob@example.com',
          password: 'Password123!',
        });
      assert.strictEqual(resB.status, 201);
      userB = resB.body.data.user;
      userBToken = resB.body.data.token;

      const resC = await request(app)
        .post('/api/auth/signup')
        .send({
          fullName: 'Charlie Brown',
          email: 'charlie@example.com',
          password: 'Password123!',
        });
      assert.strictEqual(resC.status, 201);
      userC = resC.body.data.user;
      userCToken = resC.body.data.token;
    });

    // 4. Test Login
    await test('4. Login: Valid credentials returns JWT and safe user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'Password123!',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.token);
      assert.strictEqual(res.body.data.user.password, undefined);
    });

    // 5. Test Login with Invalid Password
    await test('5. Login: Invalid password fails authentication', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'WrongPassword!',
        });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    // 6. Test Auth Middleware Protection
    await test('6. Auth Middleware: Accessing protected endpoint without token returns 401', async () => {
      const res = await request(app).get('/api/users/me');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    await test('7. Auth Middleware: Accessing protected endpoint with token succeeds', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${userAToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.user._id, userA._id);
    });

    // 8. Start Chat Using Email
    await test('8. Conversations: Start 1-to-1 chat using email address', async () => {
      const res = await request(app)
        .post('/api/conversations/start')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          email: 'BOB@EXAMPLE.COM', // Test case-insensitivity
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.conversation._id);
      conversationId = res.body.data.conversation._id;
    });

    // 9. Prevent Duplicate 1-to-1 Chat
    await test('9. Conversations: Starting chat again with same email returns existing conversation', async () => {
      const res = await request(app)
        .post('/api/conversations/start')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          email: 'bob@example.com',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.isNew, false);
      assert.strictEqual(res.body.data.conversation._id, conversationId);
    });

    // 10. Prevent Chat with Non-Existent Account
    await test('10. Conversations: Starting chat with non-existent email returns 404', async () => {
      const res = await request(app)
        .post('/api/conversations/start')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          email: 'ghost@nonexistent.com',
        });

      assert.strictEqual(res.status, 404);
    });

    // 11. Send Message
    await test('11. Messaging: Send a text message in conversation', async () => {
      const res = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          conversationId,
          text: 'Hello Bob! How are you doing?',
          messageType: 'text',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.message.text, 'Hello Bob! How are you doing?');
      assert.strictEqual(res.body.data.message.senderId._id, userA._id);
      messageId = res.body.data.message._id;
    });

    // 12. Edit Own Message
    await test('12. Messaging: Sender can edit their own text message', async () => {
      const res = await request(app)
        .put(`/api/messages/${messageId}/edit`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          text: 'Hello Bob! How are you doing today?',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.message.text, 'Hello Bob! How are you doing today?');
      assert.strictEqual(res.body.data.message.edited, true);
      assert.ok(res.body.data.message.editedAt);
    });

    // 13. Prevent Editing Another User's Message
    await test('13. Messaging: Prevent user from editing another user message', async () => {
      const res = await request(app)
        .put(`/api/messages/${messageId}/edit`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          text: 'Hacked message text',
        });

      assert.strictEqual(res.status, 403);
    });

    // 14. Message Reactions
    await test('14. Messaging: Add, change, and remove message reactions', async () => {
      // Bob reacts with ❤️
      const res1 = await request(app)
        .post(`/api/messages/${messageId}/reaction`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ emoji: '❤️' });

      assert.strictEqual(res1.status, 200);
      assert.strictEqual(res1.body.data.message.reactions.length, 1);
      assert.strictEqual(res1.body.data.message.reactions[0].emoji, '❤️');

      // Bob changes reaction to 👍
      const res2 = await request(app)
        .post(`/api/messages/${messageId}/reaction`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ emoji: '👍' });

      assert.strictEqual(res2.status, 200);
      assert.strictEqual(res2.body.data.message.reactions.length, 1);
      assert.strictEqual(res2.body.data.message.reactions[0].emoji, '👍');

      // Bob clicks 👍 again -> removes reaction
      const res3 = await request(app)
        .post(`/api/messages/${messageId}/reaction`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ emoji: '👍' });

      assert.strictEqual(res3.status, 200);
      assert.strictEqual(res3.body.data.message.reactions.length, 0);
    });

    // 15. Read Receipts
    await test('15. Messaging: Mark messages as read by recipient', async () => {
      const res = await request(app)
        .put(`/api/messages/conversation/${conversationId}/read`)
        .set('Authorization', `Bearer ${userBToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.conversationId, conversationId);
      assert.strictEqual(res.body.data.userId, userB._id);
    });

    // 16. Delete for Me
    await test('16. Messaging: Delete for Me hides message only for requester', async () => {
      // Send a message to test delete for me
      const msgRes = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ conversationId, text: 'This message will be deleted for Bob only' });
      const testMsgId = msgRes.body.data.message._id;

      // Bob deletes for me
      const delRes = await request(app)
        .delete(`/api/messages/${testMsgId}/me`)
        .set('Authorization', `Bearer ${userBToken}`);

      assert.strictEqual(delRes.status, 200);

      // Bob fetches messages: testMsgId should NOT appear
      const bobMsgs = await request(app)
        .get(`/api/messages/conversation/${conversationId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      const bobMsgIds = bobMsgs.body.data.items.map((m) => m._id);
      assert.strictEqual(bobMsgIds.includes(testMsgId), false);

      // Alice fetches messages: testMsgId SHOULD appear
      const aliceMsgs = await request(app)
        .get(`/api/messages/conversation/${conversationId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      const aliceMsgIds = aliceMsgs.body.data.items.map((m) => m._id);
      assert.strictEqual(aliceMsgIds.includes(testMsgId), true);
    });

    // 17. Delete for Everyone within 5 minutes
    await test('17. Messaging: Delete for Everyone within 5 minutes succeeds', async () => {
      const msgRes = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ conversationId, text: 'Secret message to delete' });
      const secretMsgId = msgRes.body.data.message._id;

      const delRes = await request(app)
        .delete(`/api/messages/${secretMsgId}/everyone`)
        .set('Authorization', `Bearer ${userAToken}`);

      assert.strictEqual(delRes.status, 200);
      assert.strictEqual(delRes.body.data.message.deletedForEveryone, true);
      assert.strictEqual(delRes.body.data.message.text, 'This message was deleted');
    });

    // 18. Prevent Delete for Everyone after 5 minutes
    await test('18. Messaging: Prevent Delete for Everyone after 5-minute limit', async () => {
      const msgRes = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ conversationId, text: 'Old message created long ago' });
      const oldMsgId = msgRes.body.data.message._id;

      // Update directly via MongoDB driver collection to simulate older timestamp
      await Message.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(oldMsgId) },
        { $set: { createdAt: new Date(Date.now() - 10 * 60 * 1000) } }
      );

      const delRes = await request(app)
        .delete(`/api/messages/${oldMsgId}/everyone`)
        .set('Authorization', `Bearer ${userAToken}`);

      assert.strictEqual(delRes.status, 400);
      assert.ok(delRes.body.message.includes('can no longer be deleted for everyone'));
    });

    // 19. Status / Stories: Create Status
    await test('19. Status: Create a 24-hour status story', async () => {
      const res = await request(app)
        .post('/api/status')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          type: 'text',
          text: 'Enjoying my weekend coding session! 🚀',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.status.text, 'Enjoying my weekend coding session! 🚀');
      assert.ok(res.body.data.status.expiresAt);
      statusId = res.body.data.status._id;
    });

    // 20. Status Views and Unique Viewer Count
    await test('20. Status: View status and track unique viewer count', async () => {
      // Bob views Alice's status
      const viewRes1 = await request(app)
        .post(`/api/status/${statusId}/view`)
        .set('Authorization', `Bearer ${userBToken}`);

      assert.strictEqual(viewRes1.status, 200);
      assert.strictEqual(viewRes1.body.data.uniqueViewersCount, 1);

      // Bob views it a second time -> should NOT increase unique count
      const viewRes2 = await request(app)
        .post(`/api/status/${statusId}/view`)
        .set('Authorization', `Bearer ${userBToken}`);

      assert.strictEqual(viewRes2.status, 200);
      assert.strictEqual(viewRes2.body.data.uniqueViewersCount, 1);

      // Charlie views it -> increases count to 2
      const viewRes3 = await request(app)
        .post(`/api/status/${statusId}/view`)
        .set('Authorization', `Bearer ${userCToken}`);

      assert.strictEqual(viewRes3.status, 200);
      assert.strictEqual(viewRes3.body.data.uniqueViewersCount, 2);

      // Alice retrieves viewers list
      const viewersRes = await request(app)
        .get(`/api/status/${statusId}/viewers`)
        .set('Authorization', `Bearer ${userAToken}`);

      assert.strictEqual(viewersRes.status, 200);
      assert.strictEqual(viewersRes.body.data.totalViews, 2);
      assert.strictEqual(viewersRes.body.data.viewers.length, 2);
    });

    // 21. Groups: Create Group and Admin Permissions
    await test('21. Groups: Create group with members and verify admin permissions', async () => {
      const res = await request(app)
        .post('/api/groups')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Tech Enthusiasts',
          description: 'A group for discussing tech innovations',
          members: [userB._id],
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.group.name, 'Tech Enthusiasts');
      assert.strictEqual(res.body.data.group.owner._id, userA._id);
      groupId = res.body.data.group._id;

      // Alice (Admin) adds Charlie
      const addRes = await request(app)
        .post(`/api/groups/${groupId}/members`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ userId: userC._id });

      assert.strictEqual(addRes.status, 200);
      assert.strictEqual(addRes.body.data.group.members.length, 3);

      // Charlie (Normal Member) tries to add another user or update group -> fails 403
      const unauthorizedUpdate = await request(app)
        .put(`/api/groups/${groupId}`)
        .set('Authorization', `Bearer ${userCToken}`)
        .send({ name: 'Hacked Group Name' });

      assert.strictEqual(unauthorizedUpdate.status, 403);
    });

    // 22. Communities: Create Community and Manage Admins
    await test('22. Communities: Create community, add groups and verify permissions', async () => {
      const res = await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Open Source Community',
          description: 'Developers collaborating on open source software',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.community.name, 'Open Source Community');
      communityId = res.body.data.community._id;

      // Add group to community
      const addGrpRes = await request(app)
        .post(`/api/communities/${communityId}/groups`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ groupId });

      assert.strictEqual(addGrpRes.status, 200);

      // Bob joins the community
      const joinRes = await request(app)
        .post(`/api/communities/${communityId}/join`)
        .set('Authorization', `Bearer ${userBToken}`);

      assert.strictEqual(joinRes.status, 200);

      // Promote Bob to community admin
      const promoteRes = await request(app)
        .put(`/api/communities/${communityId}/admins/promote`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ userId: userB._id });

      assert.strictEqual(promoteRes.status, 200);
    });

    // 23. Search and Pagination
    await test('23. Search & Pagination: Search users and paginate conversation messages', async () => {
      // Search users by name/email
      const searchRes = await request(app)
        .get('/api/users/search?q=Bob')
        .set('Authorization', `Bearer ${userAToken}`);

      assert.strictEqual(searchRes.status, 200);
      assert.ok(searchRes.body.data.users.some((u) => u.email === 'bob@example.com'));

      // Paginated messages query
      const pagRes = await request(app)
        .get(`/api/messages/conversation/${conversationId}?page=1&limit=2`)
        .set('Authorization', `Bearer ${userAToken}`);

      assert.strictEqual(pagRes.status, 200);
      assert.ok(pagRes.body.data.pagination);
      assert.strictEqual(pagRes.body.data.pagination.page, 1);
      assert.strictEqual(pagRes.body.data.pagination.limit, 2);
    });

    console.log('\n=======================================================');
    console.log(`🎉 TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('=======================================================\n');

    await disconnectDB();

    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (globalError) {
    console.error('Fatal test error:', globalError);
    await disconnectDB();
    process.exit(1);
  }
};

runTests();
