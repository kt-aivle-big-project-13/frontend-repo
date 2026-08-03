import {
  CloseOutlined,
  MessageOutlined,
  SendOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import {
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useAuthStore } from '../../../entities/user/model/authStore';
import { useLoginPromptStore } from '../../../entities/user/model/loginPromptStore';
import { sendChatbotMessage } from '../../../features/chatbot/api/chatbotApi';
import type { ChatbotMessage } from '../../../features/chatbot/model/chatbotTypes';

import './ChatbotWidget.css';

function ChatbotWidget() {
  const isAuthenticated = useAuthStore(
    (state) =>
      Boolean(state.accessToken && state.user),
  );

  const showLoginPrompt = useLoginPromptStore(
    (state) => state.show,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] =
    useState<ChatbotMessage[]>([]);
  const [isSending, setIsSending] =
    useState(false);

  const messageListRef =
    useRef<HTMLDivElement | null>(null);

  const handleToggle = () => {
    if (!isAuthenticated) {
      showLoginPrompt();
      return;
    }

    setIsOpen((previous) => !previous);
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput || isSending) {
      return;
    }

    // 챗봇을 열어둔 상태에서 토큰이 만료되거나 로그아웃될 가능성도 있으므로 전송 직전에 로그인 상태를 다시 검사
    if (!isAuthenticated) {
      setIsOpen(false);
      showLoginPrompt();
      return;
    }

    const userMessage: ChatbotMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmedInput,
      status: 'success',
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setInput('');
    setIsSending(true);

    try {
      const response =
        await sendChatbotMessage({
          message: trimmedInput,
        });

      const assistantMessage: ChatbotMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: response.answer,
        status: 'success',
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (error: unknown) {
      const isAuthenticationError =
        axios.isAxiosError(error) &&
        (error.response?.status === 401 ||
          error.response?.status === 403);

      // 토큰이 만료됐거나 인증이 거부된 경우에는 일반 오류 말풍선을 추가하지 않고 챗봇을 닫은 뒤 로그인 안내를 표시
      if (isAuthenticationError) {
        setIsOpen(false);
        showLoginPrompt();
        return;
      }

      const errorMessage: ChatbotMessage = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content:
          '답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        status: 'error',
      };

      setMessages((previous) => [
        ...previous,
        errorMessage,
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void handleSend();
    }
  };

  // 메시지나 로딩 표시가 추가되면 채팅 영역을 가장 아래로 이동
  useEffect(() => {
    const messageList =
      messageListRef.current;

    if (!messageList) {
      return;
    }

    messageList.scrollTop =
      messageList.scrollHeight;
  }, [messages, isSending]);

  return (
    <div className="chatbot-widget">
      {isOpen && (
        <section
          className="chatbot-panel"
          aria-label="AI 도우미"
        >
          <header className="chatbot-header">
            <div className="chatbot-header__content">
              <div className="chatbot-header__icon">
                <MessageOutlined />
              </div>

              <div>
                <h2>AI 도우미</h2>
                <p>
                  감사 결과와 서비스 이용을 도와드려요.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="chatbot-close-button"
              onClick={handleToggle}
              aria-label="챗봇 닫기"
            >
              <CloseOutlined />
            </button>
          </header>

          <div
            ref={messageListRef}
            className="chatbot-message-list"
            aria-live="polite"
          >
            {messages.length === 0 &&
              !isSending && (
                <div className="chatbot-empty">
                  <MessageOutlined />

                  <strong>
                    무엇을 도와드릴까요?
                  </strong>

                  <p>
                    감사 결과 확인부터 서비스 이용 안내까지
                    질문해 보세요.
                  </p>
                </div>
              )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={[
                  'chatbot-message',
                  `chatbot-message--${message.role}`,
                  message.status === 'error'
                    ? 'chatbot-message--error'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {message.role ===
                  'assistant' && (
                  <div className="chatbot-message__avatar">
                    AI
                  </div>
                )}

                <div className="chatbot-message__bubble">
                  {message.content}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="chatbot-message chatbot-message--assistant">
                <div className="chatbot-message__avatar">
                  AI
                </div>

                <div className="chatbot-message__bubble chatbot-message__bubble--loading">
                  <span className="chatbot-loading-dot" />
                  <span className="chatbot-loading-dot" />
                  <span className="chatbot-loading-dot" />

                  <span className="chatbot-loading-text">
                    답변을 작성하고 있습니다.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="chatbot-input-area">
            <textarea
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder="궁금한 내용을 입력해 주세요."
              rows={1}
              disabled={isSending}
              aria-label="챗봇 메시지 입력"
            />

            <button
              type="button"
              className="chatbot-send-button"
              onClick={() => {
                void handleSend();
              }}
              disabled={
                !input.trim() || isSending
              }
              aria-label="메시지 전송"
            >
              <SendOutlined />
            </button>
          </div>
        </section>
      )}

      <button
        type="button"
        className={`chatbot-toggle-button ${
            isOpen ? 'chatbot-toggle-button--open' : ''
        }`}
        onClick={handleToggle}
        aria-label={isOpen ? '챗봇 닫기' : '챗봇 열기'}
        aria-expanded={isOpen}
        >
        <img
            src="/chatbot-icon.jpg"
            alt=""
            className="chatbot-toggle-image"
            aria-hidden="true"
        />
        </button>
    </div>
  );
}

export default ChatbotWidget;