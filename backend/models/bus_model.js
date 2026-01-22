import mongoose from 'mongoose';

const BusSchema = new mongoose.Schema({
  bus_number: {
    type: String,
    required: true,
    unique: true 
  },
  vehicle_type: {
    type: String,
    default: 'Bus' 
  },
  capacity: {
    type: Number,
    default: 40
  },
  default_route_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'routes',
    default: null
  }
}, { timestamps: true });

export default mongoose.model('buses', BusSchema);