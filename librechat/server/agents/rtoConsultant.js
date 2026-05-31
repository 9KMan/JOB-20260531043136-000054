import AgentConfig from '../models/AgentConfig.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const DEFAULT_RTO_CONSULTANT_PROMPT = `You are an RTO Consultant AI assistant specializing in Australian vocational education and training compliance.

Your responsibilities include:
- Helping RTOs understand training.gov.au requirements
- Guiding CRICOS compliance for international student providers
- Explaining Australian Skills Quality Authority (ASQA) regulations
- Advising on NVR (National Vocational Education) requirements
- Providing information about training packages and accredited courses

You have access to tools for looking up RTO details and CRICOS registrations. Always verify information through official government sources where possible.

IMPORTANT COMPLIANCE NOTICES:
- Your responses are logged for audit purposes
- When review mode is enabled, responses may be reviewed by human administrators
- Always recommend consulting with a qualified education consultant for complex compliance matters
- Do not provide legal advice; suggest seeking legal counsel for regulatory issues

Tool usage guidelines:
- Use training_gov_au_lookup to verify RTO numbers and registration status
- Use cricos_lookup to check CRICOS provider compliance
- Use credit_balance_check to inform users about their credit usage
- Use submit_for_human_review when responses may need compliance review

Maintain professional, accurate, and helpful communication at all times.`;

/**
 * Get or create RTO Consultant agent configuration
 */
const getRTOConsultantConfig = async () => {
  try {
    let config = await AgentConfig.findByAgentType('rto_consultant');

    if (!config) {
      logger.info('Creating default RTO Consultant configuration');
      
      config = await AgentConfig.create({
        agentType: 'rto_consultant',
        systemPrompt: DEFAULT_RTO_CONSULTANT_PROMPT,
        allowedTools: [
          'training_gov_au_lookup',
          'cricos_lookup',
          'credit_balance_check',
          'submit_for_human_review'
        ],
        blockedTools: [
          'execute_arbitrary_code',
          'system_admin',
          'file_operations'
        ],
        mcpServerIds: ['training_gov_au', 'cricos', 'credit_engine', 'review_queue'],
        isolationLevel: 'runtime'
      });
    }

    return config;
  } catch (err) {
    logger.error('Failed to get RTO Consultant config', { error: err.message });
    throw err;
  }
};

/**
 * Update RTO Consultant configuration
 */
const updateRTOConsultantConfig = async (updates) => {
  try {
    const config = await getRTOConsultantConfig();
    
    Object.assign(config, updates);
    await config.save();

    logger.info('RTO Consultant config updated', { updates: Object.keys(updates) });
    
    return config;
  } catch (err) {
    logger.error('Failed to update RTO Consultant config', { error: err.message });
    throw err;
  }
};

/**
 * Validate tool access for RTO Consultant agent
 */
const validateToolAccess = (toolName, config) => {
  // Check if blocked
  if (config.blockedTools.includes(toolName)) {
    return {
      allowed: false,
      reason: `Tool ${toolName} is explicitly blocked`
    };
  }

  // Check if allowed list is enforced
  if (config.allowedTools.length > 0 && !config.allowedTools.includes(toolName)) {
    return {
      allowed: false,
      reason: `Tool ${toolName} is not in allowed tools list`
    };
  }

  return { allowed: true };
};

export {
  getRTOConsultantConfig,
  updateRTOConsultantConfig,
  validateToolAccess,
  DEFAULT_RTO_CONSULTANT_PROMPT
};