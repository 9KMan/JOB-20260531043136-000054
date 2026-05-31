import mongoose from 'mongoose';

const mcpServerSchema = new mongoose.Schema({
  serverId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  authType: {
    type: String,
    enum: ['api_key', 'bearer', 'oauth2', 'none'],
    default: 'api_key'
  },
  authCredentials: {
    type: String,
    default: null
  },
  rateLimit: {
    type: Number,
    default: 100,
    min: 1,
    max: 10000
  },
  rateLimitWindow: {
    type: Number,
    default: 3600000 // 1 hour in milliseconds
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for checking if rate limited
mcpServerSchema.methods.isRateLimited = function(requestCount) {
  return requestCount >= this.rateLimit;
};

// Static to find active server by ID
mcpServerSchema.statics.findActiveByServerId = function(serverId) {
  return this.findOne({ serverId, isActive: true });
};

const MCPServer = mongoose.model('MCPServer', mcpServerSchema);

export default MCPServer;