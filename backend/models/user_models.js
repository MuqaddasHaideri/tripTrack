import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // ==========================================
  // SHARED USER INFORMATION
  // Common fields available for all user roles.
  // ==========================================
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: "" },
  role: { type: String, enum: ['passenger', 'driver', 'admin'], required: true },
  phone: { type: String, default: '' },

  // ==========================================
  // DRIVER-SPECIFIC INFORMATION
  // These fields are only required when the
  // user registers as a driver.
  // ==========================================
  cnic: {
    type: String,
    required: function () { return this.role === 'driver'; }
  },
  driverLicense: {
    type: String,
    required: function () { return this.role === 'driver'; }
  },
  // Indicates whether the driver's account
  // has been approved by an administrator.
  isVerified: {
    type: Boolean,
    default: false
  },
  assignedBusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'buses',
    default: null
  },
   // List of routes bookmarked by passengers
  favoriteRoutes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'routes'
  }],
  fcmToken: {
    type: String,
    default: ''
  }
}, { timestamps: true });

export default mongoose.model('users', UserSchema);