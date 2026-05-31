import express from 'express';
import { body, param, validationResult } from 'express-validator';
import MCPServer from '../models/MCPServer.js';
import { executeTool, listTools } from '../mcp/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { runtimeIsolate } from '../../lib/isolation/runtimeIsolate.js';
import winston from 'winston';

const router = express.Router();
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

/**
 * GET /api/mcp/servers
 * List all registered MCP servers
 */
router.get('/servers', authMiddleware, async (req, res) => {
  try {
    const servers = await MCPServer.find({})
      .select('-authCredentials')
      .sort({ name: 1 });

    res.json({
      success: true,
      servers: servers.map(s => ({
        serverId: s.serverId,
        name: s.name,
        endpoint: s.endpoint,
        authType: s.authType,
        rateLimit: s.rateLimit,
        isActive: s.isActive
      }))
    });
  } catch (err) {
    logger.error('Failed to list MCP servers', { error: err.message });
    res.status(500).json({ error: 'Failed to list MCP servers' });
  }
});

/**
 * POST /api/mcp/servers
 * Register a new MCP server
 */
router.post('/servers',
  authMiddleware,
  body('serverId').notEmpty().isString(),
  body('name').notEmpty().isString(),
  body('endpoint').notEmpty().isURL(),
  body('authType').optional().isIn(['api_key', 'bearer', 'oauth2', 'none']),
  body('authCredentials').optional().isString(),
  body('rateLimit').optional().isInt({ min: 1, max: 10000 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        serverId,
        name,
        endpoint,
        authType = 'api_key',
        authCredentials,
        rateLimit = 100
      } = req.body;

      // Check if server already exists
      const existing = await MCPServer.findOne({ serverId });
      if (existing) {
        return res.status(409).json({ error: 'MCP server with this ID already exists' });
      }

      const server = await MCPServer.create({
        serverId,
        name,
        endpoint,
        authType,
        authCredentials,
        rateLimit,
        isActive: true
      });

      logger.info('MCP server registered', { serverId, name });

      res.status(201).json({
        success: true,
        server: {
          serverId: server.serverId,
          name: server.name,
          endpoint: server.endpoint,
          authType: server.authType,
          rateLimit: server.rateLimit,
          isActive: server.isActive
        }
      });
    } catch (err) {
      logger.error('Failed to register MCP server', { error: err.message });
      res.status(500).json({ error: 'Failed to register MCP server' });
    }
  }
);

/**
 * GET /api/mcp/servers/:serverId
 * Get a specific MCP server
 */
router.get('/servers/:serverId',
  authMiddleware,
  param('serverId').notEmpty().isString(),
  async (req, res) => {
    try {
      const server = await MCPServer.findOne({ serverId: req.params.serverId })
        .select('-authCredentials');

      if (!server) {
        return res.status(404).json({ error: 'MCP server not found' });
      }

      res.json({
        success: true,
        server: {
          serverId: server.serverId,
          name: server.name,
          endpoint: server.endpoint,
          authType: server.authType,
          rateLimit: server.rateLimit,
          isActive: server.isActive
        }
      });
    } catch (err) {
      logger.error('Failed to get MCP server', { error: err.message, serverId: req.params.serverId });
      res.status(500).json({ error: 'Failed to get MCP server' });
    }
  }
);

/**
 * PATCH /api/mcp/servers/:serverId
 * Update an MCP server
 */
router.patch('/servers/:serverId',
  authMiddleware,
  param('serverId').notEmpty().isString(),
  body('name').optional().isString(),
  body('endpoint').optional().isURL(),
  body('authCredentials').optional().isString(),
  body('rateLimit').optional().isInt({ min: 1, max: 10000 }),
  body('isActive').optional().isBoolean(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const server = await MCPServer.findOne({ serverId: req.params.serverId });

      if (!server) {
        return res.status(404).json({ error: 'MCP server not found' });
      }

      const allowedUpdates = ['name', 'endpoint', 'authCredentials', 'rateLimit', 'isActive'];
      
      for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
          server[field] = req.body[field];
        }
      }

      await server.save();

      logger.info('MCP server updated', { serverId: server.serverId });

      res.json({
        success: true,
        server: {
          serverId: server.serverId,
          name: server.name,
          endpoint: server.endpoint,
          authType: server.authType,
          rateLimit: server.rateLimit,
          isActive: server.isActive
        }
      });
    } catch (err) {
      logger.error('Failed to update MCP server', { error: err.message, serverId: req.params.serverId });
      res.status(500).json({ error: 'Failed to update MCP server' });
    }
  }
);

/**
 * DELETE /api/mcp/servers/:serverId
 * Delete an MCP server
 */
router.delete('/servers/:serverId',
  authMiddleware,
  param('serverId').notEmpty().isString(),
  async (req, res) => {
    try {
      const result = await MCPServer.deleteOne({ serverId: req.params.serverId });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'MCP server not found' });
      }

      logger.info('MCP server deleted', { serverId: req.params.serverId });

      res.json({ success: true, message: 'MCP server deleted' });
    } catch (err) {
      logger.error('Failed to delete MCP server', { error: err.message, serverId: req.params.serverId });
      res.status(500).json({ error: 'Failed to delete MCP server' });
    }
  }
);

/**
 * GET /api/mcp/tools
 * List all available MCP tools
 */
router.get('/tools', authMiddleware, async (req, res) => {
  try {
    const tools = await listTools();

    res.json({
      success: true,
      tools
    });
  } catch (err) {
    logger.error('Failed to list MCP tools', { error: err.message });
    res.status(500).json({ error: 'Failed to list MCP tools' });
  }
});

/**
 * POST /api/mcp/execute
 * Execute an MCP tool with given parameters
 */
router.post('/execute',
  authMiddleware,
  body('toolName').notEmpty().isString(),
  body('params').optional().isObject(),
  body('sessionConfig').optional().isObject(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { toolName, params = {}, sessionConfig } = req.body;

      logger.info('MCP tool execution requested', {
        toolName,
        userId: req.user.id,
        paramKeys: Object.keys(params)
      });

      // Execute tool with runtime isolation
      const result = await runtimeIsolate.runToolIsolation(
        toolName,
        async (p) => {
          return executeTool(toolName, p, sessionConfig);
        },
        params
      );

      res.json({
        success: true,
        tool: toolName,
        result: result.result,
        isolationLevel: result.isolationLevel
      });
    } catch (err) {
      logger.error('MCP tool execution failed', {
        toolName: req.body.toolName,
        error: err.message
      });

      res.status(400).json({
        success: false,
        error: err.message,
        tool: req.body.toolName
      });
    }
  }
);

export default router;