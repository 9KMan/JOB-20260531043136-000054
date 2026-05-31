import Session from '../models/Session.js';
import { submitReviewTool } from '../mcp/tools/submit_for_human_review.js';
import { runtimeIsolate } from '../../lib/isolation/runtimeIsolate.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

/**
 * Review mode middleware
 * Intercepts AI responses when session has reviewInjectionEnabled flag
 * and queues them for human review before delivery to user
 */
const reviewModeMiddleware = async (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to intercept responses
  res.json = async function(body) {
    try {
      // Check if this is an AI response that needs review
      if (isAIResponse(body, req.session)) {
        logger.info('Intercepting AI response for review', {
          sessionId: req.session?.sessionId,
          userId: req.user?.id
        });

        await queueForReview(body, req);
        
        // Modify response to indicate pending review
        body.reviewPending = true;
        body.reviewMessage = 'This response is pending human review and will be available shortly.';
      }
    } catch (err) {
      logger.error('Review mode interception failed', {
        error: err.message,
        sessionId: req.session?.sessionId
      });
      // Don't fail the request, continue without review
    }

    return originalJson(body);
  };

  next();
};

/**
 * Determine if response is an AI response needing review
 */
const isAIResponse = (body, session) => {
  if (!session?.agentConfig?.reviewInjectionEnabled) {
    return false;
  }

  // Check if response contains AI-generated content
  if (body && typeof body === 'object') {
    // AI response typically has 'content' or 'message' fields
    return !!(body.content || body.message || body.response);
  }

  return false;
};

/**
 * Queue response for human review
 */
const queueForReview = async (body, req) => {
  try {
    const messageId = body.messageId || body.id || generateUUID();
    
    // Use runtime isolation for safety
    await runtimeIsolate.runToolIsolation(
      'submit_for_human_review',
      async (params) => {
        return submitReviewTool.execute({
          session_id: req.session?.sessionId,
          message_id: messageId,
          prompt: extractPrompt(body),
          ai_response: extractResponse(body),
          user_id: req.user?.id
        });
      },
      { sessionId: req.session?.sessionId }
    );

    logger.info('Response queued for human review', {
      sessionId: req.session?.sessionId,
      messageId
    });
  } catch (err) {
    logger.error('Failed to queue response for review', {
      error: err.message,
      sessionId: req.session?.sessionId
    });
    throw err;
  }
};

/**
 * Extract prompt from response body
 */
const extractPrompt = (body) => {
  return body.prompt || body.userMessage || body.context || 'Unknown prompt';
};

/**
 * Extract AI response from body
 */
const extractResponse = (body) => {
  return body.content || body.message || body.response || JSON.stringify(body);
};

/**
 * Generate UUID for message tracking
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Middleware to load session and attach to request
 */
const loadSessionMiddleware = async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    
    if (sessionId) {
      const session = await Session.findOne({ sessionId });
      req.session = session;
    }

    next();
  } catch (err) {
    logger.error('Failed to load session', { error: err.message });
    next();
  }
};

export {
  reviewModeMiddleware,
  loadSessionMiddleware,
  isAIResponse,
  queueForReview
};