import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  targetAudience: {
    type: String,
    enum: ['all', 'passenger', 'driver'],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

AnnouncementSchema.index({ targetAudience: 1, createdAt: -1 });

export default mongoose.model('announcements', AnnouncementSchema);
