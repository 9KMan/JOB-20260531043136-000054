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
 * Service interface to FastAPI credit engine
 */
class CreditService {
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
   * Get credit balance for a user
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Balance information
   */
  async getBalance(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/api/credits/${userId}`, {
        method: 'GET',
        headers: this.headers,
        timeout: 5000
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { found: false, balance: 0, message: 'No credit account found' };
        }
        throw new Error(`Credit engine error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        found: true,
        balance: data.balance || 0,
        accountId: data.account_id,
        rtoId: data.rto_id
      };
    } catch (err) {
      logger.error('Failed to get credit balance', { userId, error: err.message });
      throw err;
    }
  }

  /**
   * Deduct credits for API usage
   * @param {string} userId - User UUID
   * @param {number} amount - Amount to deduct
   * @param {string} reason - Reason for deduction
   * @returns {Promise<Object>} Transaction result
   */
  async deductCredits(userId, amount, reason = 'api_usage') {
    try {
      const response = await fetch(`${this.baseUrl}/api/credits/deduct`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          user_id: userId,
          amount: Math.abs(amount),
          reason
        }),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Credit deduction failed: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('Credits deducted', { userId, amount, reason });
      
      return {
        success: true,
        newBalance: data.new_balance,
        transactionId: data.transaction_id
      };
    } catch (err) {
      logger.error('Failed to deduct credits', { userId, amount, error: err.message });
      throw err;
    }
  }

  /**
   * Add credits (purchase or refund)
   * @param {string} userId - User UUID
   * @param {number} amount - Amount to add
   * @param {string} reason - Reason ('purchase', 'refund', 'bonus')
   * @param {string} stripePaymentIntent - Stripe payment intent ID
   * @returns {Promise<Object>} Transaction result
   */
  async addCredits(userId, amount, reason, stripePaymentIntent = null) {
    try {
      const response = await fetch(`${this.baseUrl}/api/credits/add`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          user_id: userId,
          amount: Math.abs(amount),
          reason: reason || 'purchase',
          stripe_payment_intent: stripePaymentIntent
        }),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Credit addition failed: ${response.status}`);
      }

      const data = await response.json();
      
      logger.info('Credits added', { userId, amount, reason });
      
      return {
        success: true,
        newBalance: data.new_balance,
        transactionId: data.transaction_id
      };
    } catch (err) {
      logger.error('Failed to add credits', { userId, amount, error: err.message });
      throw err;
    }
  }

  /**
   * Check if user has sufficient credits
   * @param {string} userId - User UUID
   * @param {number} required - Minimum required credits
   * @returns {Promise<boolean>} Whether user has sufficient credits
   */
  async hasSufficientCredits(userId, required) {
    try {
      const result = await this.getBalance(userId);
      return result.balance >= required;
    } catch (err) {
      logger.error('Credit check failed', { userId, error: err.message });
      // Fail safe - don't allow operation if we can't check
      return false;
    }
  }

  /**
   * Get transaction history for a user
   * @param {string} userId - User UUID
   * @param {number} limit - Max transactions to return
   * @returns {Promise<Array>} Transaction history
   */
  async getTransactionHistory(userId, limit = 50) {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/credits/${userId}/transactions?limit=${limit}`,
        {
          method: 'GET',
          headers: this.headers,
          timeout: 5000
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get transactions: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      logger.error('Failed to get transaction history', { userId, error: err.message });
      throw err;
    }
  }
}

// Singleton instance
const creditService = new CreditService();

export { CreditService, creditService };