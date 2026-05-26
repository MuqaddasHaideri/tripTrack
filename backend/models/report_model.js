import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  reportType: { 
    type: String, 
    enum: ['transit_issue', 'app_bug', 'suggestion'], 
    required: true 
  },
  
  isAnonymous: { type: Boolean, default: false },
  reportedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'users',
    default: null 
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: function() { 
      return this.reportType === 'transit_issue' || this.reportType === 'app_bug'; 
    }
  },
 busRoute: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'routes',                        
    default: null 
  },
  issueType: { 
    type: String, 
    required: function() { return this.reportType === 'transit_issue'; } 
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },

  description: { 
    type: String, 
    required: function() { 
      return this.reportType === 'app_bug' || this.reportType === 'suggestion'; 
    } 
  },
  
  screenshotUrl: { type: String, default: "" }

}, { timestamps: true });

export default mongoose.model('reports', ReportSchema);