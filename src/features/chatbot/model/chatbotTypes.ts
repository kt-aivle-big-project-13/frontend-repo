export type ChatRole = 'USER' | 'ASSISTANT';

export type GroundingStatus =
  | 'GROUNDED'
  | 'PARTIAL'
  | 'NOT_GROUNDED';

// 근거 충실도는 GROUNDED/PARTIAL/NOT_GROUNDED 영어 코드 그대로 오므로, 화면에는
// 한글 라벨로 바꿔 보여준다.
export const GROUNDING_STATUS_LABEL: Record<GroundingStatus, string> = {
  GROUNDED: '근거 충분',
  PARTIAL: '근거 일부',
  NOT_GROUNDED: '근거 부족',
};

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