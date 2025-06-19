
import Notification from '../models/notification.model.js';
import { ApiResponse } from '../utils/apiResponse.js';

const readNotification = (req, res) => {
    const { notificationId } = req.params;
    console.log("Reading notification with ID:", notificationId);
    
    if (!notificationId) {
        return res.status(400).json({ error: "Notification ID is required" });
    }

   const notification = Notification.findById(notificationId);
    notification.isRead = true;
    notification.save();
    return res.status(200).json(new ApiResponse(200,"Notification read successfully", notification));
};

export default readNotification;

