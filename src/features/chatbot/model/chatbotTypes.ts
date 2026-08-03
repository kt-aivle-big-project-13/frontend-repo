export type ChatbotMessageRole =
  | 'user'
  | 'assistant';

export type ChatbotMessageStatus =
  | 'success'
  | 'error';

export interface ChatbotMessage {
  id: string;
  role: ChatbotMessageRole;
  content: string;
  status?: ChatbotMessageStatus;
}

export interface ChatbotRequest {
  message: string;
}

export interface ChatbotResponse {
  answer: string;
}