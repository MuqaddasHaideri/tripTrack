import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profilePic: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    enum: ['passenger', 'driver', 'admin'],
    required: true 
  },
  phone: {
    type: String,
    default: ''
  },
  assignedBusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    default: null
  },
}, { timestamps: true }); 

export default mongoose.model('users', UserSchema);