import fetch from 'node-fetch';
import MCPServer from '../../models/MCPServer.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const CRICOS_BASE_URL = 'https://cricos.StudyInAustralia';

const cricosTool = {
  serverId: 'cricos',
  name: 'cricos_lookup',
  description: 'Look up CRICOS provider registration details for international education providers',
  parameters: {
    type: 'object',
    properties: {
      provider_code: {
        type: 'string',
        description: 'CRICOS provider code (e.g., 12345678901)',
        pattern: '^[0-9]{5,10}$'
      }
    },
    required: ['provider_code']
  },

  /**
   * Execute CRICOS provider lookup
   * @param {Object} params - { provider_code: string }
   * @returns {Promise<Object>} CRICOS provider details
   */
  execute: async (params) => {
    const { provider_code } = params;

    if (!provider_code || !/^[0-9]{5,10}$/.test(provider_code)) {
      throw new Error('Invalid CRICOS provider code format. Must be 5-10 digits.');
    }

    try {
      const serverConfig = await MCPServer.findActiveByServerId('cricos');

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      if (serverConfig?.authType === 'api_key' && serverConfig?.authCredentials) {
        headers['Authorization'] = `ApiKey ${serverConfig.authCredentials}`;
      }

      logger.info('Looking up CRICOS provider', { provider_code });

      // Call CRICOS API
      // Note: This is a placeholder URL structure
      const response = await fetch(
        `${CRICOS_BASE_URL}/api/providers/${provider_code}`,
        {
          method: 'GET',
          headers,
          timeout: 10000
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            found: false,
            provider_code,
            message: 'Provider not found in CRICOS registry'
          };
        }
        throw new Error(`CRICOS API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        found: true,
        provider_code,
        provider_name: data.providerName || data.name,
        status: data.registrationStatus || data.status,
        registration_date: data.registrationDate,
        expiry_date: data.expiryDate,
        address: {
          campus: data.campusAddress,
          state: data.stateTerritory,
          postcode: data.postcode
        },
        courses: data.courses || [],
        international_student_capacity: data.internationalStudentCapacity,
        source: 'CRICOS',
        looked_up_at: new Date().toISOString()
      };
    } catch (err) {
      logger.error('CRICOS lookup failed', {
        provider_code,
        error: err.message
      });
      throw err;
    }
  }
};

export { cricosTool };