import fetch from 'node-fetch';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const CREDIT_ENGINE_URL = process.env.CREDIT_ENGINE_URL || 'http://localhost:8000';

const submitReviewTool = {
  serverId: 'review_queue',
  name: 'submit_for_human_review',
  description: 'Submit an AI response to the human review queue before delivery to user',
  parameters: {
    type: 'object',
    properties: {
      session_id: {
        type: 'string',
        description: 'Chat session UUID',
        format: 'uuid'
      },
      message_id: {
        type: 'string',
        description: 'Message UUID within the session',
        format: 'uuid'
      },
      prompt: {
        type: 'string',
        description: 'The user prompt that generated this response'
      },
      ai_response: {
        type: 'string',
        description: 'The AI-generated response to be reviewed'
      },
      user_id: {
        type: 'string',
        description: 'User UUID who sent the prompt'
      }
    },
    required: ['session_id', 'message_id', 'prompt', 'ai_response', 'user_id']
  },

  /**
   * Submit message for human review via FastAPI review queue
   * @param {Object} params - submission parameters
   * @returns {Promise<Object>} Review queue entry confirmation
   */
  execute: async (params) => {
    const { session_id, message_id, prompt, ai_response, user_id } = params;

    // Validate required fields
    if (!session_id || !message_id) {
      throw new Error('session_id and message_id are required');
    }

    if (!prompt || !ai_response) {
      throw new Error('prompt and ai_response are required');
    }

    try {
      logger.info('Submitting message for human review', {
        session_id,
        message_id,
        user_id
      });

      const response = await fetch(`${CREDIT_ENGINE_URL}/api/review-queue`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id,
          session_id,
          message_id,
          prompt,
          ai_response,
          status: 'pending',
          submitted_at: new Date().toISOString()
        }),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Review queue API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        review_id: data.id || data.review_id,
        status: 'pending',
        session_id,
        message_id,
        submitted_at: new Date().toISOString(),
        message: 'Response submitted for human review. User will be notified when review is complete.'
      };
    } catch (err) {
      logger.error('Submit for review failed', {
        session_id,
        message_id,
        error: err.message
      });
      throw err;
    }
  }
};

export { submitReviewTool };