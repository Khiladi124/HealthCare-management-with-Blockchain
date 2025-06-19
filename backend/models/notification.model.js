import mongoose,{Schema} from 'mongoose';

const notificationSchema = new Schema({

    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['appointment', 'report', 'general'],
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;