import MCPServer from '../models/MCPServer.js';
import { trainingGovAuTool } from './servers/trainingGovAu.js';
import { cricosTool } from './servers/cricos.js';
import { creditBalanceTool } from '../tools/credit_balance_check.js';
import { submitReviewTool } from '../tools/submit_for_human_review.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Tool registry mapping tool names to implementations
const toolRegistry = {
  'training_gov_au_lookup': trainingGovAuTool,
  'cricos_lookup': cricosTool,
  'credit_balance_check': creditBalanceTool,
  'submit_for_human_review': submitReviewTool
};

// Rate limiting per server
const rateLimitStore = new Map();

/**
 * Get or create rate limit tracker for a server
 */
const getRateLimitTracker = (serverId) => {
  if (!rateLimitStore.has(serverId)) {
    rateLimitStore.set(serverId, {
      count: 0,
      windowStart: Date.now()
    });
  }
  return rateLimitStore.get(serverId);
};

/**
 * Check if request is within rate limit
 */
const checkRateLimit = async (serverId) => {
  try {
    const server = await MCPServer.findActiveByServerId(serverId);
    if (!server) {
      throw new Error(`MCP Server ${serverId} not found or inactive`);
    }

    const tracker = getRateLimitTracker(serverId);
    const now = Date.now();

    // Reset window if expired
    if (now - tracker.windowStart > server.rateLimitWindow) {
      tracker.count = 0;
      tracker.windowStart = now;
    }

    if (tracker.count >= server.rateLimit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(tracker.windowStart + server.rateLimitWindow)
      };
    }

    tracker.count++;
    return {
      allowed: true,
      remaining: server.rateLimit - tracker.count,
      resetAt: new Date(tracker.windowStart + server.rateLimitWindow)
    };
  } catch (err) {
    logger.error('Rate limit check failed', { serverId, error: err.message });
    throw err;
  }
};

/**
 * Execute a tool with isolation and rate limiting
 */
const executeTool = async (toolName, params, sessionConfig) => {
  const tool = toolRegistry[toolName];
  
  if (!tool) {
    throw new Error(`Tool ${toolName} not found in registry`);
  }

  // Check if tool is allowed for this session's agent
  if (sessionConfig?.allowedTools?.length > 0 && 
      !sessionConfig.allowedTools.includes(toolName)) {
    throw new Error(`Tool ${toolName} is not allowed for this agent`);
  }

  // Check if tool is blocked
  if (sessionConfig?.blockedTools?.includes(toolName)) {
    throw new Error(`Tool ${toolName} is blocked for this agent`);
  }

  // Check rate limit
  const serverId = tool.serverId || 'default';
  const rateCheck = await checkRateLimit(serverId);
  
  if (!rateCheck.allowed) {
    throw new Error(`Rate limit exceeded for ${toolName}. Resets at ${rateCheck.resetAt}`);
  }

  logger.info('Executing MCP tool', {
    tool: toolName,
    serverId,
    params: Object.keys(params)
  });

  try {
    const result = await tool.execute(params);
    
    return {
      success: true,
      tool: toolName,
      result,
      rateLimit: rateCheck
    };
  } catch (err) {
    logger.error('Tool execution failed', {
      tool: toolName,
      error: err.message
    });
    throw err;
  }
};

/**
 * List all available tools
 */
const listTools = async () => {
  const tools = [];
  
  for (const [name, tool] of Object.entries(toolRegistry)) {
    tools.push({
      name,
      description: tool.description,
      serverId: tool.serverId,
      parameters: tool.parameters
    });
  }
  
  return tools;
};

/**
 * Get tool schema for LLM function calling
 */
const getToolSchemas = () => {
  return Object.entries(toolRegistry).map(([name, tool]) => ({
    name,
    description: tool.description,
    parameters: tool.parameters
  }));
};

export {
  executeTool,
  listTools,
  getToolSchemas,
  toolRegistry
};