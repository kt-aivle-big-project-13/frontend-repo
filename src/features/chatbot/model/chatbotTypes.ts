export type ChatRole = 'USER' | 'ASSISTANT';

export type GroundingStatus =
  | 'GROUNDED'
  | 'PARTIAL'
  | 'NOT_GROUNDED';

export type CitationType =
  | 'AUDIT_METRIC'
  | 'GROUP_STAT'
  | 'LAW_ARTICLE'
  | 'REPORT_SECTION';

export interface ChatConversationCreateRequest {
  title?: string;
}

export interface ChatConversationResponse {
  conversationId: number;
  auditId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageCreateRequest {
  question: string;
}

export interface ChatCitationResponse {
  citationId: number;
  type: CitationType;
  reference: string;
  snippet: string | null;
  similarity: number | null;
  sourceUrl: string | null;
}

export interface ChatMessageResponse {
  messageId: number;
  role: ChatRole;
  content: string;
  groundingStatus: GroundingStatus | null;
  citations: ChatCitationResponse[];
  createdAt: string;
}

export type ChatbotMessageStatus =
  | 'success'
  | 'error';

export interface ChatbotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: ChatbotMessageStatus;
  groundingStatus?: GroundingStatus | null;
  citations?: ChatCitationResponse[];
}