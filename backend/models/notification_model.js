import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['driver_registration', 'user_report', 'general'],
    default: 'general'
  },
  referenceId: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
}, { timestamps: true });

NotificationSchema.index({ isRead: 1, readAt: 1 });
NotificationSchema.index({ createdAt: 1 });

export default mongoose.model('notifications', NotificationSchema);
