const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../config/logger');

class AIService {
  constructor() {
    // Initialize OpenAI client only if API key is provided
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else {
      this.openai = null;
      logger.warn('OpenAI API key not provided. OpenAI features will be disabled.');
    }
    
    // Initialize Gemini client only if API key is provided
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.geminiModel = this.gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
    } else {
      this.gemini = null;
      this.geminiModel = null;
      logger.warn('Gemini API key not provided. Gemini features will be disabled.');
    }

  }

  /**
   * Generate professional bio using OpenAI
   * @param {string} name - User's name
   * @param {string} role - User's role/profession
   * @returns {Promise<string>} Generated bio
   */
  async generateBioWithOpenAI(name, role) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }

      const prompt = `Generate a comprehensive, professional bio (100-200 words) for a person named ${name} who works as a ${role}. The bio should be engaging, professional, and highlight their expertise, experience, and passion for their field. Include details about their skills, approach to work, and commitment to excellence. Do not include any personal information beyond what's provided.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a professional bio writer. Create detailed, engaging professional bios between 100-200 words that highlight expertise, experience, and passion without being overly promotional. Focus on professional qualities, skills, and work approach.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 250,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      const bio = completion.choices[0].message.content.trim();
      logger.info(`Generated bio using OpenAI for ${name} (${role})`);
      return bio;

    } catch (error) {
      logger.error('OpenAI bio generation failed:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
        stack: error.stack
      });
      // Re-throw the original error to preserve error details for retry logic
      throw error;
    }
  }

  /**
   * Generate professional bio using Google Gemini
   * @param {string} name - User's name
   * @param {string} role - User's role/profession
   * @returns {Promise<string>} Generated bio
   */
  async generateBioWithGemini(name, role) {
    if (!this.geminiModel) {
      throw new Error('Gemini API is not configured');
    }

    try {
      const prompt = `Generate a professional bio for ${name} who is a ${role}. 
      
      Requirements:
      - Write in third person
      - Length: 100-200 words
      - Professional tone
      - Include expertise, experience, and key qualities
      - Focus on professional achievements and skills
      - Make it engaging and well-structured
      
      Do not include any formatting, just return the bio text.`;

      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      const bio = response.text().trim();
      
      logger.info(`Generated bio using Gemini for ${name} (${role})`);
      return bio;

    } catch (error) {
      logger.error('Gemini bio generation failed:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
        stack: error.stack
      });
      // Re-throw the original error to preserve error details for retry logic
      throw error;
    }
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate bio with OpenAI using retry mechanism
   * @param {string} name - User's name
   * @param {string} role - User's role/profession
   * @param {number} maxRetries - Maximum number of retry attempts
   * @param {number} baseDelay - Base delay in milliseconds for exponential backoff
   * @returns {Promise<string>} Generated bio
   */
  async generateBioWithRetry(name, role, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`OpenAI bio generation attempt ${attempt}/${maxRetries} for ${name} (${role})`);
        return await this.generateBioWithOpenAI(name, role);
      } catch (error) {
        lastError = error;
        
        // Log detailed error information
        logger.error(`OpenAI bio generation attempt ${attempt} failed:`, {
          message: error.message,
          status: error.status,
          code: error.code,
          type: error.type,
          stack: error.stack
        });

        // Don't retry on certain error types that won't be resolved by retrying
        if (error.status === 401 || error.status === 403 || error.code === 'invalid_api_key') {
          logger.error('Authentication error - not retrying');
          throw error;
        }

        // If this isn't the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          logger.info(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // If all retries failed, throw the last error
    logger.error(`All ${maxRetries} OpenAI bio generation attempts failed`);
    throw lastError;
  }

  /**
   * Main method to generate bio using OpenAI with retry mechanism and Gemini fallback
   * @param {string} name - User's name
   * @param {string} role - User's role/profession
   * @returns {Promise<string>} Generated bio
   */
  async generateBio(name, role) {
    // Try OpenAI first if configured
    if (process.env.OPENAI_API_KEY && this.openai) {
      try {
        logger.info('Attempting bio generation with OpenAI');
        return await this.generateBioWithRetry(name, role);
      } catch (error) {
        logger.warn('OpenAI bio generation failed after retries, attempting Gemini fallback:', {
          error: error.message
        });
        
        // If OpenAI fails completely, try Gemini as fallback
        if (this.geminiModel) {
          try {
            logger.info('Falling back to Gemini for bio generation');
            return await this.generateBioWithGemini(name, role);
          } catch (geminiError) {
            logger.error('Both OpenAI and Gemini failed:', {
              openaiError: error.message,
              geminiError: geminiError.message
            });
            throw new Error(`Bio generation failed: OpenAI (${error.message}) and Gemini (${geminiError.message}) both failed`);
          }
        } else {
          logger.error('OpenAI failed and Gemini not configured');
          throw error;
        }
      }
    }
    
    // If OpenAI is not configured, try Gemini directly
    if (this.geminiModel) {
      logger.info('OpenAI not configured, using Gemini for bio generation');
      return await this.generateBioWithGemini(name, role);
    }
    
    // If neither service is configured
    const error = new Error('No AI service is configured. Please set either OPENAI_API_KEY or GEMINI_API_KEY environment variable.');
    logger.error('No AI service configured');
    throw error;
  }

  /**
   * Validate if AI services are configured
   * @returns {Object} Configuration status
   */
  getServiceStatus() {
    const openaiConfigured = !!(process.env.OPENAI_API_KEY && this.openai);
    const geminiConfigured = !!(process.env.GEMINI_API_KEY && 
                               process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' && 
                               this.geminiModel);
    
    return {
      openai: openaiConfigured,
      gemini: geminiConfigured,
      hasAnyService: openaiConfigured || geminiConfigured,
      fallback: geminiConfigured // Gemini serves as fallback when OpenAI fails
    };
  }
}

module.exports = new AIService();