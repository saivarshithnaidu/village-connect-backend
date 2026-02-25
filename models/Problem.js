const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['infrastructure', 'health', 'education', 'agriculture', 'water', 'electricity', 'transport', 'other'],
    required: true
  },
  location: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [{
    type: String
  }],
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  solutions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Solution'
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  completionMessage: {
    type: String,
    trim: true
  },
  isCompletedByVillager: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Problem', problemSchema);

