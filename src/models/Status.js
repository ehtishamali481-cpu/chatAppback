import mongoose from 'mongoose';
import { STATUS_TYPES, TIME_LIMITS } from '../config/constants.js';

const statusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    type: {
      type: String,
      enum: Object.values(STATUS_TYPES),
      default: STATUS_TYPES.TEXT,
    },
    text: {
      type: String,
      default: '',
      trim: true,
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaMeta: {
      publicId: { type: String, default: '' },
      fileName: { type: String, default: '' },
      fileSize: { type: Number, default: 0 },
      mimeType: { type: String, default: '' },
    },
    viewers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + TIME_LIMITS.STATUS_EXPIRATION_HOURS * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

statusSchema.index({ userId: 1, expiresAt: 1 });
statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); 

const Status = mongoose.model('Status', statusSchema);

export default Status;
