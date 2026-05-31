import fetch from 'node-fetch';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const CREDIT_ENGINE_URL = process.env.CREDIT_ENGINE_URL || 'http://localhost:8000';

const creditBalanceTool = {
  serverId: 'credit_engine',
  name: 'credit_balance_check',
  description: 'Check current credit balance for a user from the FastAPI credit engine',
  parameters: {
    type: 'object',
    properties: {
      user_id: {
        type: 'string',
        description: 'User UUID to check credit balance',
        format: 'uuid'
      }
    },
    required: ['user_id']
  },

  /**
   * Check credit balance via FastAPI credit engine
   * @param {Object} params - { user_id: string }
   * @returns {Promise<Object>} Credit balance information
   */
  execute: async (params) => {
    const { user_id } = params;

    if (!user_id) {
      throw new Error('user_id is required');
    }

    try {
      logger.info('Checking credit balance', { user_id });

      const response = await fetch(`${CREDIT_ENGINE_URL}/api/credits/${user_id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            found: false,
            user_id,
            balance: 0,
            message: 'No credit account found for user'
          };
        }
        throw new Error(`Credit engine API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        found: true,
        user_id,
        balance: data.balance || 0,
        account_id: data.account_id,
        currency: 'credits',
        last_updated: data.updated_at || new Date().toISOString()
      };
    } catch (err) {
      logger.error('Credit balance check failed', {
        user_id,
        error: err.message
      });
      throw err;
    }
  }
};

export { creditBalanceTool };