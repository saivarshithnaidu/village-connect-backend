const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema({
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  proposedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'implemented'],
    default: 'pending'
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  estimatedCost: {
    type: Number
  },
  estimatedTime: {
    type: String
  },
  implementedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Solution', solutionSchema);

