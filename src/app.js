import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import apiRoutes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.APP_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed for this origin'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'WhatsApp Messaging Backend API is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'WhatsApp Web Messaging Backend API',
    version: '1.0.0',
    description: 'Production-ready REST API and Socket.IO real-time messaging backend',
    documentation: {
      endpoints: {
        auth: '/api/auth (signup, login, logout, me)',
        users: '/api/users (search, profile, last-seen, online)',
        conversations: '/api/conversations (startby, list, archive, mute, pin)',
        messages: '/api/messages (send, read, edit, delete for everyone / me, react, search)',
        status: '/api/status (create, get my, contacts, view, viewers count)',
        groups: '/api/groups (create, update, members, admins)',
        communities: '/api/communities (create, groups, announcements, admins)',
        uploads: '/api/uploads (multipart/form-data media upload)',
      },
      realtime: 'Socket.IO available on same host and port',
    },
  });
});

app.use('/api', apiLimiter);

app.use('/api', apiRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
