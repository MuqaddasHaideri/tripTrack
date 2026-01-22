import mongoose from 'mongoose';

const RouteSchema = new mongoose.Schema({
  route_name: {
    type: String,
    required: true, 
    unique: true
  },
  color_hex: {
    type: String,
    default: '#000000' 
  },
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  stops: [{
    stop_name: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  }],
  polyline: [{
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  }]
}, { timestamps: true });

export default mongoose.model('routes', RouteSchema);