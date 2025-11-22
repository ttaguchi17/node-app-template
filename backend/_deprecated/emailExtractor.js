const axios = require('axios');

const EXTRACTOR_URL = 'http://localhost:8000';

class EmailExtractorService {
  static async extractBooking(emailData) {
    try {
      const response = await axios.post(
        `${EXTRACTOR_URL}/extract`,
        {
          email_id: emailData.email_id || `manual_${Date.now()}`,
          user_token: 'mock'
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Extractor error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      };
    }
  }
}

module.exports = EmailExtractorService;