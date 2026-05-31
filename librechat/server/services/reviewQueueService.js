import fetch from 'node-fetch';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

const CREDIT_ENGINE_URL = process.env.CREDIT_ENGINE_URL || 'http://localhost:8000';
const CREDIT_ENGINE_API_KEY = process.env.CREDIT_ENGINE_API_KEY || '';

/**
 * Service for managing human review queue via FastAPI backend
 */
class ReviewQueueService {
  constructor(baseUrl = CREDIT_ENGINE_URL) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    if (CREDIT_ENGINE_API_KEY) {
      this.headers['Authorization'] = `Bearer ${CREDIT_ENGINE_API_KEY}`;
    }
  }

  /**
   * Submit an AI response for human review
   * @param {Object} params - Review submission parameters
   * @returns {Promise<Object>} Review queue entry
   */
  async submitForReview({ userId, sessionId, messageId, prompt, aiResponse }) {
    try {
      const response = await fetch(`${this.baseUrl}/api/review-queue`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          message_id: messageId,
          prompt,
          ai_response: aiResponse,
          status: 'pending',
          submitted_at: new Date().toISOString()
        }),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Review submission failed: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('Response submitted for review', {
        reviewId: data.id,
        sessionId
      });

      return {
        success: true,
        reviewId: data.id,
        status: 'pending'
      };
    } catch (err) {
      logger.error('Failed to submit for review', {
        sessionId,
        error: err.message
      });
      throw err;
    }
  }

  /**
   * Get pending reviews (admin endpoint)
   * @param {number} limit - Max number of reviews to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<Array>} List of pending reviews
   */
  async getPendingReviews(limit = 20, offset = 0) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/review-queue?limit=${limit}&offset=${offset}&status=pending`,
        {
          method: 'GET',
          headers: this.headers,
          timeout: 5000
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get pending reviews: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      logger.error('Failed to get pending reviews', { error: err.message });
      throw err;
    }
  }

  /**
   * Get a specific review by ID
   * @param {string} reviewId - Review UUID
   * @returns {Promise<Object>} Review details
   */
  async getReview(reviewId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/review-queue/${reviewId}`, {
        method: 'GET',
        headers: this.headers,
        timeout: 5000
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get review: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      logger.error('Failed to get review', { reviewId, error: err.message });
      throw err;
    }
  }

  /**
   * Approve a review (admin endpoint)
   * @param {string} reviewId - Review UUID
   * @param {string} reviewedBy - Admin user UUID
   * @param {string} comment - Optional review comment
   * @returns {Promise<Object>} Updated review
   */
  async approveReview(reviewId, reviewedBy, comment = null) {
    try {
      const response = await fetch(`${this.baseUrl}/api/review-queue/${reviewId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({
          status: 'approved',
          reviewed_by: reviewedBy,
          comment,
          reviewed_at: new Date().toISOString()
        }),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Failed to approve review: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('Review approved', { reviewId, reviewedBy });

      return {
        success: true,
        review: data
      };
    } catch (err) {
      logger.error('Failed to approve review', { reviewId, error: err.message });
      throw err;
    }
  }

  /**
   * Escalate a review (admin endpoint)
   * @param {string} reviewId - Review UUID
   * @param {string} reviewedBy - Admin user UUID
   * @param {string} reason - Escalation reason
   * @returns {Promise<Object>} Updated review
   */
  async escalateReview(reviewId, reviewedBy, reason) {
    try {
      const response = await fetch(`${this.baseUrl}/api/review-queue/${reviewId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({
          status: 'escalated',
          reviewed_by: reviewedBy,
          escalation_reason: reason,
          reviewed_at: new Date().toISOString()
        }),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Failed to escalate review: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('Review escalated', { reviewId, reason });

      return {
        success: true,
        review: data
      };
    } catch (err) {
      logger.error('Failed to escalate review', { reviewId, error: err.message });
      throw err;
    }
  }

  /**
   * Reject a review (admin endpoint)
   * @param {string} reviewId - Review UUID
   * @param {string} reviewedBy - Admin user UUID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Updated review
   */
  async rejectReview(reviewId, reviewedBy, reason) {
    try {
      const response = await fetch(`${this.baseUrl}/api/review-queue/${reviewId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({
          status: 'rejected',
          reviewed_by: reviewedBy,
          rejection_reason: reason,
          reviewed_at: new Date().toISOString()
        }),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Failed to reject review: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('Review rejected', { reviewId, reason });

      return {
        success: true,
        review: data
      };
    } catch (err) {
      logger.error('Failed to reject review', { reviewId, error: err.message });
      throw err;
    }
  }
}

// Singleton instance
const reviewQueueService = new ReviewQueueService();

export { ReviewQueueService, reviewQueueService };