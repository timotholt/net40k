import axiosInstance from './axiosConfig';
import logger from '../utils/logger';

class ChatService {
  async initialize() {
    logger.info('Initializing ChatService...');
    return this;
  }

  // Fetch chat messages
  async getChatMessages(gameId) {
    try {
      logger.info('Fetching chat messages', { gameId });
      const response = await axiosInstance.get(`/chat/${gameId}`);
      logger.info('Chat messages fetched successfully', { 
        gameId, 
        messageCount: response.data.length 
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching chat messages', { 
        gameId, 
        message: error.message, 
        response: error.response?.data 
      });
      throw error;
    }
  }

  // Send a new chat message
  async sendChatMessage(messageData) {
    try {
      logger.info('Sending chat message', { messageData });
      const response = await axiosInstance.post('/chat', messageData);
      logger.info('Chat message sent successfully', { 
        messageId: response.data.id 
      });
      return response.data;
    } catch (error) {
      logger.error('Error sending chat message', { 
        message: error.message, 
        response: error.response?.data 
      });
      throw error;
    }
  }
}

// Create and export a singleton instance
const chatService = new ChatService();
export { chatService };
