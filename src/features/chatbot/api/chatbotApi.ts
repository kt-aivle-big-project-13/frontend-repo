import { apiClient } from '../../../shared/api/client';
import type {
  ChatConversationCreateRequest,
  ChatConversationResponse,
  ChatMessageCreateRequest,
  ChatMessageResponse,
} from '../model/chatbotTypes';

export async function createChatConversation(
  auditId: number,
  request?: ChatConversationCreateRequest,
): Promise<ChatConversationResponse> {
  const { data } =
    await apiClient.post<ChatConversationResponse>(
      `/audits/${auditId}/conversations`,
      request,
    );

  return data;
}

export async function sendChatMessage(
  conversationId: number,
  request: ChatMessageCreateRequest,
): Promise<ChatMessageResponse> {
  const { data } =
    await apiClient.post<ChatMessageResponse>(
      `/conversations/${conversationId}/messages`,
      request,
    );

  return data;
}

export async function getChatMessages(
  conversationId: number,
): Promise<ChatMessageResponse[]> {
  const { data } =
    await apiClient.get<ChatMessageResponse[]>(
      `/conversations/${conversationId}/messages`,
    );

  return data;
}

export async function deleteChatConversation(
  conversationId: number,
): Promise<void> {
  await apiClient.delete(
    `/conversations/${conversationId}`,
  );
}