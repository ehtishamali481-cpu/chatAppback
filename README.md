# WhatsApp Web Messaging Backend API

A production-ready, scalable, real-time messaging and REST API backend built with **Node.js**, **Express.js**, **MongoDB (Mongoose)**, and **Socket.IO**.

---

## 🌟 Overview & Features

- **Robust Authentication & Security**:
  - Email/Password signup with case-insensitive unique email normalization
  - Password hashing with `bcryptjs` (salt rounds: 10)
  - JSON Web Tokens (JWT) for stateless HTTP authorization and Socket.IO handshake auth
  - Security hardening with `Helmet`, `CORS`, and `express-rate-limit`
  - Centralized error handling and standard `{ success, message, data }` response contract
- **1-to-1 & Group Messaging**:
  - Start direct chat simply by entering the recipient's email
  - Strict deduplication: prevents duplicate 1-to-1 conversations between same participants
  - Group chats with owner, multiple admins, member promotion/demotion, and custom permissions
  - Communities with integrated announcement channel and multi-group aggregation
- **Real-Time Communication (Socket.IO)**:
  - Instant message delivery with room-based multiplexing (`conversation_<id>`)
  - Live typing indicators (`typing:start`, `typing:stop`)
  - Live online/offline status tracking with persistent `lastSeen` timestamp
  - Real-time read receipts (`Sent`, `Delivered`, `Read`)
  - Live emoji reactions (add, change, remove)
- **Advanced Message Controls**:
  - Message editing (text-only, sender-only, preserved edit timestamps)
  - **"Delete for Everyone"**: sender-only with configurable 5-minute time window enforcement
  - **"Delete for Me"**: per-user soft deletion tracking without affecting others
  - Message replies with preview references & forwarding without media duplication
- **WhatsApp-Style Status / Stories**:
  - Ephemeral text, image, and video status updates with automatic 24-hour expiration
  - Unique viewer tracking (preventing duplicate counts per user)
  - Owner viewer list inspection ("Viewed by X people")
- **Media Uploads & Storage**:
  - `Multer` middleware for multipart file processing with size & MIME type validation
  - Cloudinary cloud storage integration with automatic fallback to local disk storage

---

## 🛠️ Technology Stack

- **Runtime**: Node.js (ES Modules)
- **Web Framework**: Express.js 4.x
- **Database**: MongoDB with Mongoose ODM (includes fallback in-memory MongoDB for zero-configuration testing/dev)
- **Real-Time Engine**: Socket.IO 4.x
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs`
- **Security**: `helmet`, `cors`, `express-rate-limit`, `cookie-parser`
- **Validation**: `express-validator`
- **File Uploads**: `multer`, `cloudinary`
- **Testing**: Node Test Runner with `supertest` and `mongodb-memory-server`

---

## 📂 Project Architecture

```
/
├── src/
│   ├── config/
│   │   ├── constants.js       # App-wide enums, time limits, MIME types
│   │   ├── db.js              # Mongoose DB connection & in-memory fallback
│   │   └── cloudinary.js      # Cloudinary configuration
│   ├── models/
│   │   ├── User.js            # User profile, credentials & presence
│   │   ├── Conversation.js    # 1-to-1 & group conversation rooms
│   │   ├── Message.js         # Messages, edits, reactions, deletions, receipts
│   │   ├── Status.js          # Ephemeral 24h stories & unique viewers
│   │   ├── Group.js           # Group chats, admins, members & roles
│   │   └── Community.js       # Communities & announcement channels
│   ├── middleware/
│   │   ├── auth.js            # JWT protection middleware
│   │   ├── errorHandler.js    # Centralized Express error handler
│   │   ├── rateLimiter.js     # Rate limiting middleware
│   │   ├── upload.js          # Multer file upload handler
│   │   └── validate.js        # Express-validator error handler
│   ├── validators/            # Input validation schemas
│   │   ├── authValidator.js
│   │   ├── userValidator.js
│   │   ├── conversationValidator.js
│   │   ├── messageValidator.js
│   │   ├── statusValidator.js
│   │   ├── groupValidator.js
│   │   └── communityValidator.js
│   ├── controllers/           # HTTP Request/Response controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── conversationController.js
│   │   ├── messageController.js
│   │   ├── statusController.js
│   │   ├── groupController.js
│   │   ├── communityController.js
│   │   └── uploadController.js
│   ├── services/              # Pure business logic & database interactions
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── conversationService.js
│   │   ├── messageService.js
│   │   ├── statusService.js
│   │   ├── groupService.js
│   │   ├── communityService.js
│   │   └── uploadService.js
│   ├── sockets/               # Real-time WebSocket handlers
│   │   ├── socketAuth.js      # JWT authentication for Socket connections
│   │   └── socketHandler.js   # Real-time events, rooms & presence
│   ├── utils/
│   │   ├── apiResponse.js     # Standard response envelope
│   │   ├── tokenUtils.js      # JWT sign & verify
│   │   ├── passwordUtils.js   # Bcrypt hash & compare
│   │   └── pagination.js      # Page/limit helper
│   ├── uploads/               # Local storage directory for media uploads
│   ├── app.js                 # Express application configuration
│   └── server.js              # HTTP server & Socket.IO initialization
├── tests/
│   └── run-tests.js           # Comprehensive automated backend test suite
├── .env.example
├── package.json
└── README.md
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/whatsapp_db

# Authentication
JWT_SECRET=super_secret_jwt_key_whatsapp_backend_2026
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:3000

# Cloudinary (Optional: defaults to local disk storage if empty)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Messaging Rules
DELETE_FOR_EVERYONE_LIMIT_MS=300000   # 5 minutes in milliseconds
STATUS_EXPIRATION_HOURS=24
MAX_FILE_SIZE_MB=50
```

---

## 🚀 Getting Started

### 1. Installation

```bash
npm install
```

### 2. Start the Development Server

```bash
npm run dev
# or
node src/server.js
```

### 3. Run Backend Test Suite

```bash
npm test
# or
node tests/run-tests.js
```

---

## 📡 REST API Reference

All successful responses follow the standard format:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

All error responses follow:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Email already in use" }]
}
```

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new user account | No |
| `POST` | `/api/auth/login` | Login with email & password | No |
| `POST` | `/api/auth/logout` | Clear auth cookie | Yes |
| `GET` | `/api/auth/me` | Get current logged-in user profile | Yes |

### 👤 Users (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/me` | Get current user details | Yes |
| `GET` | `/api/users/search?q=query` | Search users by email, name, username | Yes |
| `GET` | `/api/users/:id` | Get user profile by ID | Yes |
| `GET` | `/api/users/:id/last-seen` | Get user's online status and last seen timestamp | Yes |
| `PUT` | `/api/users/profile` | Update user profile (name, about, username) | Yes |
| `PUT` | `/api/users/profile/image` | Update profile avatar | Yes |
| `PUT` | `/api/users/profile/about` | Update about status | Yes |
| `PUT` | `/api/users/status/online` | Update online presence status | Yes |

### 💬 Conversations (`/api/conversations`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/conversations/start` | Start or retrieve 1-to-1 conversation by email | Yes |
| `POST` | `/api/conversations` | Create group conversation | Yes |
| `GET` | `/api/conversations?page=1&limit=20` | Get paginated conversations list | Yes |
| `GET` | `/api/conversations/:id` | Get conversation details | Yes |
| `PUT` | `/api/conversations/:id/archive` | Toggle archive status | Yes |
| `PUT` | `/api/conversations/:id/mute` | Toggle mute notifications | Yes |
| `PUT` | `/api/conversations/:id/pin` | Toggle pinned conversation | Yes |
| `DELETE` | `/api/conversations/:id` | Leave or delete conversation | Yes |

### ✉️ Messages (`/api/messages`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/messages` | Send message (text, image, video, audio, doc, location, contact) | Yes |
| `GET` | `/api/messages/conversation/:conversationId` | Get paginated messages for conversation | Yes |
| `GET` | `/api/messages/conversation/:conversationId/search?q=term` | Search messages within conversation | Yes |
| `PUT` | `/api/messages/:id/edit` | Edit own message (text-only) | Yes |
| `DELETE` | `/api/messages/:id/everyone` | Delete for Everyone (within 5 min limit) | Yes |
| `DELETE` | `/api/messages/:id/me` | Delete for Me (hides only for requester) | Yes |
| `POST` | `/api/messages/:id/reaction` | Add, change, or remove emoji reaction | Yes |
| `PUT` | `/api/messages/conversation/:conversationId/read` | Mark all unread messages as read | Yes |

### ⏳ Status / Stories (`/api/status`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/status` | Create status update (24h expiration) | Yes |
| `GET` | `/api/status/my` | Get own active statuses with viewer stats | Yes |
| `GET` | `/api/status/contacts` | Get active statuses from contacts | Yes |
| `POST` | `/api/status/:id/view` | Mark status as viewed (unique tracking) | Yes |
| `GET` | `/api/status/:id/viewers` | Get list of viewers (Owner only) | Yes |
| `DELETE` | `/api/status/:id` | Delete own status | Yes |

### 👥 Groups (`/api/groups`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/groups` | Create new group | Yes |
| `GET` | `/api/groups/:id` | Get group details & members | Yes |
| `PUT` | `/api/groups/:id` | Update group name/image/description (Admin only) | Yes |
| `POST` | `/api/groups/:id/members` | Add member to group (Admin only) | Yes |
| `DELETE` | `/api/groups/:id/members` | Remove member from group (Admin only) | Yes |
| `POST` | `/api/groups/:id/leave` | Leave group | Yes |
| `PUT` | `/api/groups/:id/admins/promote` | Promote member to Admin | Yes |
| `PUT` | `/api/groups/:id/admins/demote` | Demote Admin to Member | Yes |

### 🌐 Communities (`/api/communities`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/communities` | Create community & announcement channel | Yes |
| `GET` | `/api/communities/:id` | Get community info, groups & members | Yes |
| `PUT` | `/api/communities/:id` | Update community details (Admin only) | Yes |
| `DELETE` | `/api/communities/:id` | Delete community (Owner only) | Yes |
| `POST` | `/api/communities/:id/join` | Join community | Yes |
| `POST` | `/api/communities/:id/leave` | Leave community | Yes |
| `POST` | `/api/communities/:id/groups` | Link existing group to community (Admin only) | Yes |
| `DELETE` | `/api/communities/:id/groups` | Unlink group from community (Admin only) | Yes |
| `PUT` | `/api/communities/:id/admins/promote` | Promote member to community admin | Yes |
| `PUT` | `/api/communities/:id/admins/demote` | Demote community admin | Yes |

### 📁 Uploads (`/api/uploads`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/uploads` | Upload media file (`multipart/form-data`) | Yes |

---

## ⚡ Socket.IO Real-Time Events

Connect with JWT in handshake:
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: '<YOUR_JWT_TOKEN>',
  },
});
```

### Client -> Server Events
- `conversation:join`: `{ conversationId: '...' }` (Joins room `conversation_<id>`)
- `conversation:leave`: `{ conversationId: '...' }`
- `typing:start`: `{ conversationId: '...' }`
- `typing:stop`: `{ conversationId: '...' }`
- `message:send`: `{ conversationId, text, messageType, mediaUrl, replyTo, ... }`
- `message:delivered`: `{ messageId, conversationId }`
- `message:read`: `{ conversationId }`
- `message:edit`: `{ messageId, text }`
- `message:delete`: `{ messageId }`
- `message:reaction`: `{ messageId, emoji }`

### Server -> Client Events
- `user:online`: `{ userId, online: true, fullName }`
- `user:offline`: `{ userId, online: false, lastSeen }`
- `message:new`: Full populated message object
- `conversation:updated`: `{ conversationId, lastMessage }`
- `typing:start`: `{ conversationId, userId, fullName }`
- `typing:stop`: `{ conversationId, userId }`
- `message:edit`: Full edited message object
- `message:delete`: `{ messageId, conversationId, deletedForEveryone: true }`
- `message:reaction`: `{ messageId, conversationId, reactions: [...] }`
- `message:read`: `{ conversationId, userId, readAt }`
- `status:new`: Full status object broadcast
- `status:viewed`: `{ statusId, viewerId, uniqueViewersCount }`

---

## 🧪 Testing

The backend includes a self-contained, comprehensive test suite covering all 23 key capabilities. Run with:
```bash
npm test
```
All tests run with an embedded in-memory MongoDB server, requiring no external setup or cloud dependencies.
