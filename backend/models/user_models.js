import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  // ==========================
  // SHARED FIELDS
  // ==========================
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: { type: String, default: "" },
  role: { type: String, enum: ['passenger', 'driver', 'admin'], required: true },
  phone: { type: String, default: '' },
  
  // ==========================
  // DRIVER-ONLY FIELDS
  // ==========================
  cnic: { 
    type: String, 
    required: function() { return this.role === 'driver'; } 
  },
  driverLicense: { 
    type: String, 
    required: function() { return this.role === 'driver'; } 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  assignedBusId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'buses', 
    default: null 
  },
  favoriteRoutes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'routes'
  }]
}, { timestamps: true }); 

export default mongoose.model('users', UserSchema);