import * as statusService from '../services/statusService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const createStatus = async (req, res, next) => {
  try {
    const { type, text, mediaUrl, mediaMeta } = req.body;
    const status = await statusService.createStatus(req.user._id, {
      type,
      text,
      mediaUrl,
      mediaMeta,
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('status:new', status);
    }

    return sendSuccess(res, 'Status created successfully', { status }, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyStatuses = async (req, res, next) => {
  try {
    const statuses = await statusService.getMyStatuses(req.user._id);
    return sendSuccess(res, 'My statuses retrieved', { statuses });
  } catch (error) {
    next(error);
  }
};

export const getContactsStatuses = async (req, res, next) => {
  try {
    const statuses = await statusService.getContactsStatuses(req.user._id);
    return sendSuccess(res, 'Contacts statuses retrieved', { statuses });
  } catch (error) {
    next(error);
  }
};

export const viewStatus = async (req, res, next) => {
  try {
    const result = await statusService.viewStatus(req.params.id, req.user._id);

    const io = req.app.get('io');
    if (io) {
      io.emit('status:viewed', {
        statusId: req.params.id,
        viewerId: req.user._id,
        uniqueViewersCount: result.uniqueViewersCount,
      });
    }

    return sendSuccess(res, 'Status marked as viewed', result);
  } catch (error) {
    next(error);
  }
};

export const getStatusViewers = async (req, res, next) => {
  try {
    const result = await statusService.getStatusViewers(req.params.id, req.user._id);
    return sendSuccess(res, 'Status viewers retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const deleteStatus = async (req, res, next) => {
  try {
    const result = await statusService.deleteStatus(req.params.id, req.user._id);
    return sendSuccess(res, 'Status deleted successfully', result);
  } catch (error) {
    next(error);
  }
};
