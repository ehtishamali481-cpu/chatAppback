import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async (customUri = null) => {
  try {
    const uri = customUri || process.env.MONGODB_URI;

    if (uri && uri !== 'memory') {
      try {
        const conn = await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
        return conn;
      } catch (err) {
        console.warn(`[Database] Failed to connect to ${uri}: ${err.message}. Falling back to in-memory database.`);
      }
    }

if (!mongoMemoryServer) {
      mongoMemoryServer = await MongoMemoryServer.create();
    }
    const memUri = mongoMemoryServer.getUri();
    const conn = await mongoose.connect(memUri);
    console.log(`[Database] In-Memory MongoDB Connected at: ${memUri}`);
    return conn;
  } catch (error) {
    console.error(`[Database] MongoDB connection error: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
    console.log('[Database] MongoDB Disconnected successfully.');
  } catch (error) {
    console.error(`[Database] Error during disconnect: ${error.message}`);
  }
};
