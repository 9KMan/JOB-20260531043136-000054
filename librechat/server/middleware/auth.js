import jwt from 'jsonwebtoken';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware for LibreChat API routes
 * Validates JWT tokens from FastAPI auth system
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'No authorization header provided'
      });
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Invalid authorization header format. Use: Bearer <token>'
      });
    }

    const token = parts[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Attach user info to request
      req.user = {
        id: decoded.userId || decoded.sub,
        email: decoded.email,
        rtoId: decoded.rtoId,
        roles: decoded.roles || []
      };

      logger.debug('User authenticated', { userId: req.user.id });
      
      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Please re-authenticate'
        });
      }

      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'Token signature verification failed'
        });
      }

      throw err;
    }
  } catch (err) {
    logger.error('Auth middleware error', { error: err.message });
    return res.status(500).json({
      error: 'Authentication error'
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.userId || decoded.sub,
        email: decoded.email,
        rtoId: decoded.rtoId,
        roles: decoded.roles || []
      };
    } catch (err) {
      // Token invalid but optional - continue without user
      logger.debug('Optional auth: invalid token ignored');
    }

    next();
  } catch (err) {
    next();
  }
};

/**
 * Role-based access control middleware
 */
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRoles = req.user.roles || [];
    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: requiredRoles
      });
    }

    next();
  };
};

/**
 * Generate JWT token (for testing/internal use)
 */
const generateToken = (payload, expiresIn = '24h') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  generateToken,
  JWT_SECRET
};