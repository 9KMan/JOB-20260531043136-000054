import express from 'express';
import { body, validationResult } from 'express-validator';
import AgentConfig from '../models/AgentConfig.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  getRTOConsultantConfig,
  updateRTOConsultantConfig,
  validateToolAccess
} from '../agents/rtoConsultant.js';
import { listTools } from '../mcp/index.js';
import winston from 'winston';

const router = express.Router();
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

/**
 * GET /api/agents/config
 * Get current agent configuration
 */
router.get('/config', authMiddleware, async (req, res) => {
  try {
    const config = await getRTOConsultantConfig();

    res.json({
      success: true,
      config: {
        agentType: config.agentType,
        systemPrompt: config.systemPrompt,
        allowedTools: config.allowedTools,
        blockedTools: config.blockedTools,
        mcpServerIds: config.mcpServerIds,
        isolationLevel: config.isolationLevel
      }
    });
  } catch (err) {
    logger.error('Failed to get agent config', { error: err.message });
    res.status(500).json({ error: 'Failed to get agent configuration' });
  }
});

/**
 * PUT /api/agents/config
 * Update agent configuration (admin only)
 */
router.put('/config',
  authMiddleware,
  requireRole(['admin']),
  body('systemPrompt').optional().isString(),
  body('allowedTools').optional().isArray(),
  body('blockedTools').optional().isArray(),
  body('mcpServerIds').optional().isArray(),
  body('isolationLevel').optional().isIn(['runtime', 'mongo_document']),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const updates = {};
      const allowedFields = ['systemPrompt', 'allowedTools', 'blockedTools', 'mcpServerIds', 'isolationLevel'];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      const config = await updateRTOConsultantConfig(updates);

      logger.info('Agent config updated', { updates: Object.keys(updates), adminId: req.user.id });

      res.json({
        success: true,
        config: {
          agentType: config.agentType,
          systemPrompt: config.systemPrompt,
          allowedTools: config.allowedTools,
          blockedTools: config.blockedTools,
          mcpServerIds: config.mcpServerIds,
          isolationLevel: config.isolationLevel
        }
      });
    } catch (err) {
      logger.error('Failed to update agent config', { error: err.message });
      res.status(500).json({ error: 'Failed to update agent configuration' });
    }
  }
);

/**
 * GET /api/agents/tools
 * List all available tools with access status
 */
router.get('/tools', authMiddleware, async (req, res) => {
  try {
    const tools = await listTools();
    const config = await getRTOConsultantConfig();

    const toolsWithAccess = tools.map(tool => {
      const validation = validateToolAccess(tool.name, config);
      return {
        ...tool,
        accessAllowed: validation.allowed,
        accessReason: validation.reason || null
      };
    });

    res.json({
      success: true,
      tools: toolsWithAccess
    });
  } catch (err) {
    logger.error('Failed to list agent tools', { error: err.message });
    res.status(500).json({ error: 'Failed to list tools' });
  }
});

/**
 * GET /api/agents/validate-tool/:toolName
 * Check if a specific tool is accessible
 */
router.get('/validate-tool/:toolName', authMiddleware, async (req, res) => {
  try {
    const { toolName } = req.params;
    const config = await getRTOConsultantConfig();
    const validation = validateToolAccess(toolName, config);

    res.json({
      success: true,
      toolName,
      allowed: validation.allowed,
      reason: validation.reason || null
    });
  } catch (err) {
    logger.error('Failed to validate tool', { error: err.message, toolName: req.params.toolName });
    res.status(500).json({ error: 'Failed to validate tool access' });
  }
});

export default router;