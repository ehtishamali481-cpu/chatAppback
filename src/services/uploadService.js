import fs from 'fs';
import path from 'path';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

export const processUploadedFile = async (file, folder = 'whatsapp_media') => {
  if (!file) {
    const error = new Error('No file was provided for upload');
    error.statusCode = 400;
    throw error;
  }

if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `whatsapp/${folder}`,
        resource_type: 'auto',
      });

if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
        fileType: file.mimetype,
        fileSize: file.size,
        fileName: file.originalname,
        format: result.format,
      };
    } catch (uploadError) {
      console.error('[Upload Service] Cloudinary upload failed:', uploadError);
      
    }
  }

const serverUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const filename = path.basename(file.path);
  const localUrl = `${serverUrl}/uploads/${filename}`;

  return {
    url: localUrl,
    publicId: filename,
    fileType: file.mimetype,
    fileSize: file.size,
    fileName: file.originalname,
  };
};
