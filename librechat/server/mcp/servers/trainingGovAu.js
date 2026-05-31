import fetch from 'node-fetch';
import { validationResult } from 'express-validator';
import MCPServer from '../../models/MCPServer.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const TRAINING_GOV_AU_BASE_URL = 'https://www.training.gov.au';

const trainingGovAuTool = {
  serverId: 'training_gov_au',
  name: 'training_gov_au_lookup',
  description: 'Look up RTO provider details from training.gov.au Provider Registry by RTO number',
  parameters: {
    type: 'object',
    properties: {
      rto_number: {
        type: 'string',
        description: 'RTO provider number (e.g., 1234)',
        pattern: '^[0-9]{4,6}$'
      }
    },
    required: ['rto_number']
  },

  /**
   * Execute RTO lookup
   * @param {Object} params - { rto_number: string }
   * @returns {Promise<Object>} RTO provider details
   */
  execute: async (params) => {
    const { rto_number } = params;

    if (!rto_number || !/^[0-9]{4,6}$/.test(rto_number)) {
      throw new Error('Invalid RTO number format. Must be 4-6 digits.');
    }

    try {
      // Get server config for auth
      const serverConfig = await MCPServer.findActiveByServerId('training_gov_au');
      
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      // Add auth if configured
      if (serverConfig?.authType === 'api_key' && serverConfig?.authCredentials) {
        headers['Authorization'] = `ApiKey ${serverConfig.authCredentials}`;
      }

      logger.info('Looking up RTO on training.gov.au', { rto_number });

      // Call training.gov.au API
      // Note: This is a placeholder URL structure - actual API may differ
      const response = await fetch(
        `${TRAINING_GOV_AU_BASE_URL}/api/providers/${rto_number}`,
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
            rto_number,
            message: 'RTO not found in training.gov.au registry'
          };
        }
        throw new Error(`training.gov.au API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        found: true,
        rto_number,
        provider_name: data.providerName || data.name,
        status: data.status || data.registrationStatus,
        scope: data.scope || data.trainingScopes,
        jurisdiction: data.jurisdiction || data.stateTerritory,
        registered_date: data.registrationDate || data.registeredOn,
        contact: {
          email: data.contactEmail,
          phone: data.contactPhone,
          address: data.address
        },
        courses: data.courses || [],
        source: 'training.gov.au',
        looked_up_at: new Date().toISOString()
      };
    } catch (err) {
      logger.error('training.gov.au lookup failed', {
        rto_number,
        error: err.message
      });
      throw err;
    }
  }
};

export { trainingGovAuTool };