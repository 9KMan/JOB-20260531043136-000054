import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  reviewMode: {
    type: Boolean,
    default: false
  },
  toolCall: {
    type: String,
    default: null
  },
  toolResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { _id: true });

const agentConfigSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['general', 'rto_consultant'],
    required: true
  },
  toolIsolationEnabled: {
    type: Boolean,
    default: true
  },
  reviewInjectionEnabled: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  messages: [messageSchema],
  agentConfig: agentConfigSchema,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ 'agentConfig.type': 1 });

// Update timestamp on save
sessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to add message
sessionSchema.methods.addMessage = async function(message) {
  this.messages.push(message);
  return this.save();
};

// Instance method to get messages for review
sessionSchema.methods.getReviewMessages = function() {
  return this.messages.filter(m => m.reviewMode === true);
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;