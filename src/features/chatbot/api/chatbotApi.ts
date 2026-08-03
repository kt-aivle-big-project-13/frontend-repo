import { apiClient } from '../../../shared/api/client';

import type {
  ChatbotRequest,
  ChatbotResponse,
} from '../model/chatbotTypes';

export async function sendChatbotMessage(
  request: ChatbotRequest,
): Promise<ChatbotResponse> {
  const { data } =
    await apiClient.post<ChatbotResponse>(
      '/chatbot/messages',
      request,
    );

  return data;
}