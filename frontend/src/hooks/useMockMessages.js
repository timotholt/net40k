import { useState, useCallback, useMemo } from 'react';
import { 
  mockLobbyMessages, 
  mockWhisperMessages, 
  mockNewsMessages, 
  mockSystemMessages,
  mockGameMasterMessages 
} from '../data/mockChatData';

export function useMockMessages(type) {
  // Memoize initial data based on type
  const initialData = useMemo(() => {
    switch (type) {
      case 'lobby':
        return mockLobbyMessages;
      case 'whisper':
        return mockWhisperMessages;
      case 'news':
        return mockNewsMessages;
      case 'system':
        return mockSystemMessages;
      case 'games':
        return mockGameMasterMessages;
      default:
        return [];
    }
  }, [type]);

  const [messages] = useState(initialData);

  // Simulate API filtering behavior
  const getFilteredMessages = useCallback((filter) => {
    if (!filter) return messages;
    
    const searchTerm = filter.toLowerCase();
    return messages.filter(msg => {
      const messageText = msg.message?.toLowerCase() || '';
      const username = msg.username?.toLowerCase() || '';
      return messageText.includes(searchTerm) || username.includes(searchTerm);
    });
  }, [messages]);

  return {
    messages,
    getFilteredMessages
  };
}