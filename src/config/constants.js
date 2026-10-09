export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document',
  FILE: 'file',
  LOCATION: 'location',
  CONTACT: 'contact',
};

export const STATUS_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
};

export const CONVERSATION_TYPES = {
  DIRECT: 'direct',
  GROUP: 'group',
};

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
};

export const TIME_LIMITS = {
  
  DELETE_FOR_EVERYONE_MS: parseInt(process.env.DELETE_FOR_EVERYONE_LIMIT_MS, 10) || 5 * 60 * 1000,
  
  STATUS_EXPIRATION_HOURS: parseInt(process.env.STATUS_EXPIRATION_HOURS, 10) || 24,
};

export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE_BYTES: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 50) * 1024 * 1024,
  ALLOWED_IMAGE_MIMES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_MIMES: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'],
  ALLOWED_AUDIO_MIMES: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a'],
  ALLOWED_DOC_MIMES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
  ],
};
