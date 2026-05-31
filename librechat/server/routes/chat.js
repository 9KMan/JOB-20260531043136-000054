import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import Session from '../models/Session.js';
import { authMiddleware } from '../middleware/auth.js';
import { reviewModeMiddleware, loadSessionMiddleware } from '../middleware/reviewMode.js';
import { executeTool, getToolSchemas } from '../mcp/index.js';
import { creditService } from '../services/creditService.js';
import { validateToolAccess, getRTOConsultantConfig } from '../agents/rtoConsultant.js';
import winston from 'winston';

const router = express.Router();
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

/**
 * GET /api/chat/sessions
 * List all sessions for the authenticated user
 */
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .limit(50)
      .select('sessionId agentConfig createdAt updatedAt messages');

    res.json({
      success: true,
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        agentType: s.agentConfig?.type,
        messageCount: s.messages?.length || 0,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }))
    });
  } catch (err) {
    logger.error('Failed to list sessions', { error: err.message, userId: req.user.id });
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

/**
 * POST /api/chat/sessions
 * Create a new chat session
 */
router.post('/sessions',
  authMiddleware,
  body('agentType').optional().isIn(['general', 'rto_consultant']),
  body('toolIsolationEnabled').optional().isBoolean(),
  body('reviewInjectionEnabled').optional().isBoolean(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { agentType = 'general', toolIsolationEnabled = true, reviewInjectionEnabled = false } = req.body;

      const session = await Session.create({
        sessionId: uuidv4(),
        userId: req.user.id,
        messages: [],
        agentConfig: {
          type: agentType,
          toolIsolationEnabled,
          reviewInjectionEnabled
        }
      });

      logger.info('Session created', { sessionId: session.sessionId, userId: req.user.id });

      res.status(201).json({
        success: true,
        session: {
          sessionId: session.sessionId,
          agentConfig: session.agentConfig,
          createdAt: session.createdAt
        }
      });
    } catch (err) {
      logger.error('Failed to create session', { error: err.message, userId: req.user.id });
      res.status(500).json({ error: 'Failed to create session' });
    }
  }
);

/**
 * GET /api/chat/sessions/:sessionId
 * Get a specific session with messages
 */
router.get('/sessions/:sessionId', authMiddleware, async (req, res) => {
  try {
    const session = await Session.findOne({
      sessionId: req.params.sessionId,
      userId: req.user.id
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        agentConfig: session.agentConfig,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    });
  } catch (err) {
    logger.error('Failed to get session', { error: err.message, sessionId: req.params.sessionId });
    res.status(500).json({ error: 'Failed to get session' });
  }
});

/**
 * POST /api/chat/sessions/:sessionId/messages
 * Send a message to an existing session
 */
router.post('/sessions/:sessionId/messages',
  authMiddleware,
  loadSessionMiddleware,
  body('content').notEmpty().isString(),
  body('reviewMode').optional().isBoolean(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const session = await Session.findOne({
        sessionId: req.params.sessionId,
        userId: req.user.id
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Attach session to request for review middleware
      req.session = session;

      const { content, reviewMode = false } = req.body;

      // Add user message
      const userMessage = {
        role: 'user',
        content,
        timestamp: new Date(),
        reviewMode: false
      };

      await session.addMessage(userMessage);

      logger.info('User message added', {
        sessionId: session.sessionId,
        contentLength: content.length
      });

      // Check credits before processing
      const hasCredits = await creditService.hasSufficientCredits(req.user.id, 1);
      if (!hasCredits) {
        const assistantResponse = {
          role: 'assistant',
          content: 'Insufficient credits. Please purchase more credits to continue.',
          timestamp: new Date(),
          reviewMode: false
        };
        await session.addMessage(assistantResponse);
        return res.json({
          success: false,
          error: 'Insufficient credits',
          sessionId: session.sessionId
        });
      }

      // Apply review mode middleware if enabled
      if (session.agentConfig?.reviewInjectionEnabled) {
        return reviewModeMiddleware(req, res, next);
      }

      res.json({
        success: true,
        sessionId: session.sessionId,
        message: userMessage
      });
    } catch (err) {
      logger.error('Failed to send message', { error: err.message, sessionId: req.params.sessionId });
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

/**
 * DELETE /api/chat/sessions/:sessionId
 * Delete a chat session
 */
router.delete('/sessions/:sessionId', authMiddleware, async (req, res) => {
  try {
    const result = await Session.deleteOne({
      sessionId: req.params.sessionId,
      userId: req.user.id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    logger.info('Session deleted', { sessionId: req.params.sessionId });

    res.json({ success: true, message: 'Session deleted' });
  } catch (err) {
    logger.error('Failed to delete session', { error: err.message, sessionId: req.params.sessionId });
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

/**
 * GET /api/chat/tools
 * List available MCP tools for the current agent
 */
router.get('/tools', authMiddleware, async (req, res) => {
  try {
    const tools = await getToolSchemas();
    const agentConfig = await getRTOConsultantConfig();

    // Filter tools based on agent config
    const filteredTools = tools.filter(tool => {
      const validation = validateToolAccess(tool.name, agentConfig);
      return validation.allowed;
    });

    res.json({
      success: true,
      tools: filteredTools
    });
  } catch (err) {
    logger.error('Failed to list tools', { error: err.message });
    res.status(500).json({ error: 'Failed to list tools' });
  }
});

export default router;