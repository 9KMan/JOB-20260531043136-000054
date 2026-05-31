import mongoose from 'mongoose';

const agentConfigSchema = new mongoose.Schema({
  agentType: {
    type: String,
    enum: ['rto_consultant', 'general'],
    required: true,
    unique: true
  },
  systemPrompt: {
    type: String,
    required: true
  },
  allowedTools: [{
    type: String
  }],
  blockedTools: [{
    type: String
  }],
  mcpServerIds: [{
    type: String,
    ref: 'MCPServer'
  }],
  isolationLevel: {
    type: String,
    enum: ['runtime', 'mongo_document'],
    default: 'runtime'
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

// Pre-save validation: allowedTools and blockedTools should not overlap
agentConfigSchema.pre('save', function(next) {
  const overlap = this.allowedTools.filter(tool => this.blockedTools.includes(tool));
  if (overlap.length > 0) {
    next(new Error(`Tools cannot be both allowed and blocked: ${overlap.join(', ')}`));
  }
  this.updatedAt = new Date();
  next();
});

// Static method to find config by agent type
agentConfigSchema.statics.findByAgentType = function(agentType) {
  return this.findOne({ agentType });
};

const AgentConfig = mongoose.model('AgentConfig', agentConfigSchema);

export default AgentConfig;