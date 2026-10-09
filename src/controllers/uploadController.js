import * as uploadService from '../services/uploadService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const uploadMedia = async (req, res, next) => {
  try {
    const folder = req.body.folder || 'media';
    const fileResult = await uploadService.processUploadedFile(req.file, folder);
    return sendSuccess(res, 'File uploaded successfully', fileResult, 201);
  } catch (error) {
    next(error);
  }
};
