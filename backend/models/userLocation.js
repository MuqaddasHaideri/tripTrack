import mongoose from 'mongoose';

const userLocationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'users', 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String 
  },
  latitude: { 
    type: Number, 
    required: true 
  },
  longitude: { 
    type: Number, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['recent', 'favorite'], 
    default: 'recent' 
  }
}, { timestamps: true })

export default mongoose.model('UserLocation', userLocationSchema);