// Termii SMS Service - Backup provider for OTP verification
import ProductionLogger from './productionLogger';

class TermiiService {
  constructor() {
    this.apiKey = process.env.TERMII_API_KEY;
    this.senderId = process.env.TERMII_SENDER_ID || 'CCSA';
    this.baseUrl = process.env.TERMII_BASE_URL || 'https://v3.api.termii.com';
    this.verificationCodes = new Map(); // Store verification codes for verification
    
    // Debug logging for configuration
    ProductionLogger.debug('Termii service initialized', {
      hasApiKey: !!this.apiKey,
      senderId: this.senderId,
      baseUrl: this.baseUrl
    });
  }

  /**
   * Send OTP via Termii SMS
   * @param {string} phoneNumber - Phone number in international format
   * @returns {Promise<Object>} - Verification result
   */
  async sendVerificationCode(phoneNumber) {
    try {
      if (!this.apiKey) {
        throw new Error('Termii API key not configured');
      }

      ProductionLogger.debug('Sending SMS via Termii', { 
        phoneNumber: phoneNumber.slice(-4),
        fullNumber: phoneNumber,
        senderId: this.senderId
      });

      // Generate 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const message = `Your CCSA verification code is: ${code}. Valid for 10 minutes. Do not share this code.`;

      const payload = {
        to: phoneNumber,
        from: this.senderId,
        sms: message,
        type: "plain",
        api_key: this.apiKey,
        channel: "generic"
      };

      ProductionLogger.debug('Termii SMS payload', { 
        to: phoneNumber,
        from: this.senderId,
        messageLength: message.length,
        hasApiKey: !!this.apiKey
      });

      const response = await fetch(`${this.baseUrl}/api/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        timeout: 15000 // 15 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        ProductionLogger.error('Termii SMS error', { 
          status: response.status, 
          error: errorData 
        });
        throw new Error(`Termii API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.code !== 'ok') {
        ProductionLogger.error('Termii SMS failed', { result });
        throw new Error(result.message || 'Failed to send SMS via Termii');
      }

      // Store the code for verification (expires in 10 minutes)
      const verificationId = `termii_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.verificationCodes.set(verificationId, {
        code,
        phoneNumber,
        timestamp: Date.now(),
        attempts: 0
      });

      // Clean up expired codes
      this.cleanupExpiredCodes();

      ProductionLogger.debug('Termii SMS sent successfully', { 
        messageId: result.message_id,
        verificationId 
      });

      return {
        success: true,
        verificationId,
        status: 'pending',
        messageId: result.message_id,
        provider: 'termii'
      };

    } catch (error) {
      ProductionLogger.error('Termii SMS service error', error);
      throw error;
    }
  }

  /**
   * Verify OTP code sent via Termii
   * @param {string} verificationId - Verification ID from sendVerificationCode
   * @param {string} code - 6-digit code entered by user
   * @param {string} phoneNumber - Phone number for additional validation
   * @returns {Promise<Object>} - Verification result
   */
  async verifyCode(verificationId, code, phoneNumber) {
    try {
      ProductionLogger.debug('Verifying Termii code', { 
        verificationId, 
        phoneNumber: phoneNumber.slice(-4) 
      });

      const storedData = this.verificationCodes.get(verificationId);
      
      if (!storedData) {
        return {
          success: false,
          verified: false,
          status: 'failed',
          error: 'Verification code not found or expired'
        };
      }

      // Check if code is expired (10 minutes)
      const isExpired = Date.now() - storedData.timestamp > 10 * 60 * 1000;
      if (isExpired) {
        this.verificationCodes.delete(verificationId);
        return {
          success: false,
          verified: false,
          status: 'expired',
          error: 'Verification code has expired'
        };
      }

      // Check attempts limit (max 3 attempts)
      if (storedData.attempts >= 3) {
        this.verificationCodes.delete(verificationId);
        return {
          success: false,
          verified: false,
          status: 'failed',
          error: 'Too many attempts. Please request a new code.'
        };
      }

      // Increment attempt count
      storedData.attempts++;

      // Verify phone number matches
      if (storedData.phoneNumber !== phoneNumber) {
        return {
          success: false,
          verified: false,
          status: 'failed',
          error: 'Phone number mismatch'
        };
      }

      // Verify the code
      const isValid = storedData.code === code;

      if (isValid) {
        // Clean up successful verification
        this.verificationCodes.delete(verificationId);
        
        ProductionLogger.debug('Termii code verification successful');
        
        return {
          success: true,
          verified: true,
          status: 'approved',
          provider: 'termii'
        };
      } else {
        ProductionLogger.debug('Termii code verification failed - invalid code');
        
        return {
          success: false,
          verified: false,
          status: 'failed',
          error: 'Invalid verification code',
          attemptsRemaining: 3 - storedData.attempts
        };
      }

    } catch (error) {
      ProductionLogger.error('Termii verification error', error);
      return {
        success: false,
        verified: false,
        status: 'error',
        error: 'Verification service error'
      };
    }
  }

  /**
   * Send bulk SMS (for future use)
   * @param {Array} recipients - Array of phone numbers
   * @param {string} message - SMS message
   * @returns {Promise<Object>} - Bulk SMS result
   */
  async sendBulkSMS(recipients, message) {
    try {
      if (!this.apiKey) {
        throw new Error('Termii API key not configured');
      }

      const payload = {
        to: recipients,
        from: this.senderId,
        sms: message,
        type: "plain",
        api_key: this.apiKey,
        channel: "generic"
      };

      const response = await fetch(`${this.baseUrl}/api/sms/send/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        timeout: 30000 // 30 second timeout for bulk
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Termii bulk SMS error: ${response.status}`);
      }

      const result = await response.json();
      
      ProductionLogger.debug('Termii bulk SMS sent', { 
        recipientCount: recipients.length,
        messageId: result.message_id 
      });

      return {
        success: true,
        messageId: result.message_id,
        recipientCount: recipients.length,
        provider: 'termii'
      };

    } catch (error) {
      ProductionLogger.error('Termii bulk SMS error', error);
      throw error;
    }
  }

  /**
   * Get account balance from Termii
   * @returns {Promise<Object>} - Balance information
   */
  async getBalance() {
    try {
      if (!this.apiKey) {
        throw new Error('Termii API key not configured');
      }

      const response = await fetch(`${this.baseUrl}/api/get-balance?api_key=${this.apiKey}`, {
        method: 'GET',
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Failed to get Termii balance: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        balance: result.balance,
        currency: result.currency || 'NGN',
        provider: 'termii'
      };

    } catch (error) {
      ProductionLogger.error('Termii balance check error', error);
      throw error;
    }
  }

  /**
   * Clean up expired verification codes
   */
  cleanupExpiredCodes() {
    const now = Date.now();
    for (const [verificationId, data] of this.verificationCodes.entries()) {
      // Remove codes older than 10 minutes
      if (now - data.timestamp > 10 * 60 * 1000) {
        this.verificationCodes.delete(verificationId);
      }
    }
  }

  /**
   * Test Termii service connectivity
   * @returns {Promise<Object>} - Test result
   */
  async testService() {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          message: 'Termii API key not configured'
        };
      }

      // Test by checking balance
      await this.getBalance();
      
      return {
        success: true,
        message: 'Termii service is accessible',
        provider: 'termii'
      };

    } catch (error) {
      return {
        success: false,
        message: `Termii service test failed: ${error.message}`,
        provider: 'termii'
      };
    }
  }
}

export default TermiiService;