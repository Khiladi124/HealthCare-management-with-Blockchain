import Router from 'express';
import  readNotification  from '../controllers/notification.controller.js';

const notificationRouter = Router();

notificationRouter.route('/:notificationId/read').put(readNotification);

export default notificationRouter;