import {
  CloseOutlined,
  MessageOutlined,
  SendOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useAuthStore } from '../../../entities/user/model/authStore';
import { useLoginPromptStore } from '../../../entities/user/model/loginPromptStore';
import {
  getAudits,
  type AuditSummary,
} from '../../../features/audit/api/auditApi';
import {
  createChatConversation,
  sendChatMessage,
} from '../../../features/chatbot/api/chatbotApi';
import { GROUNDING_STATUS_LABEL } from '../../../features/chatbot/model/chatbotTypes';
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

  const [audits, setAudits] =
    useState<AuditSummary[]>([]);
  const [selectedAuditId, setSelectedAuditId] =
    useState<number | null>(null);
  const [conversationId, setConversationId] =
    useState<number | null>(null);
  const [isLoadingAudits, setIsLoadingAudits] =
    useState(false);
  const [hasLoadedAudits, setHasLoadedAudits] =
    useState(false);
  const [auditLoadError, setAuditLoadError] =
    useState('');

  const messageListRef =
    useRef<HTMLDivElement | null>(null);

  const loadAudits = async () => {
    if (isLoadingAudits) {
      return;
    }

    setIsLoadingAudits(true);
    setAuditLoadError('');

    try {
      const response = await getAudits();

      // 감사 결과를 기반으로 답변하므로 완료된 감사만 선택할 수 있게 한다.
      const availableAudits = response.filter(
        (audit) =>
          audit.completedAt !== null &&
          audit.status !== 'FAILED',
      );

      setAudits(availableAudits);
      setHasLoadedAudits(true);
    } catch (error: unknown) {
      const isAuthenticationError =
        axios.isAxiosError(error) &&
        (error.response?.status === 401 ||
          error.response?.status === 403);

      if (isAuthenticationError) {
        setIsOpen(false);
        showLoginPrompt();
        return;
      }

      setAuditLoadError(
        '감사 목록을 불러오지 못했습니다.',
      );
    } finally {
      setIsLoadingAudits(false);
    }
  };

  const handleToggle = () => {
    if (!isAuthenticated) {
      showLoginPrompt();
      return;
    }

    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);

    if (
      nextIsOpen &&
      !hasLoadedAudits &&
      !isLoadingAudits
    ) {
      void loadAudits();
    }
  };

  const handleAuditChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;

    setSelectedAuditId(
      value ? Number(value) : null,
    );

    // 다른 감사를 선택하면 새로운 대화로 시작한다.
    setConversationId(null);
    setMessages([]);
    setInput('');
  };

  const getErrorMessage = (
    error: unknown,
  ): string => {
    if (!axios.isAxiosError(error)) {
      return '답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }

    switch (error.response?.status) {
      case 400:
        return '질문 내용을 확인해 주세요. 질문은 2,000자 이내로 입력해야 합니다.';

      case 404:
        return '선택한 감사 또는 대화를 찾을 수 없습니다. 감사를 다시 선택해 주세요.';

      case 429:
        return '오늘 질문할 수 있는 횟수를 초과했습니다. 내일 다시 이용해 주세요.';

      case 502:
        return 'AI 서버 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.';

      case 504:
        return 'AI 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.';

      default:
        return '답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();

    if (
      !trimmedInput ||
      isSending ||
      selectedAuditId === null
    ) {
      return;
    }

    // 토큰 만료나 로그아웃 가능성이 있으므로 전송 직전에 다시 확인한다.
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
      let currentConversationId =
        conversationId;

      // 선택한 감사에 대해 아직 대화가 없다면 먼저 생성한다.
      if (currentConversationId === null) {
        const conversation =
          await createChatConversation(
            selectedAuditId,
          );

        currentConversationId =
          conversation.conversationId;

        setConversationId(
          conversation.conversationId,
        );
      }

      const response = await sendChatMessage(
        currentConversationId,
        {
          question: trimmedInput,
        },
      );

      const assistantMessage: ChatbotMessage = {
        id: String(response.messageId),
        role: 'assistant',
        content: response.content,
        status: 'success',
        groundingStatus:
          response.groundingStatus,
        citations: response.citations,
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

      if (isAuthenticationError) {
        setIsOpen(false);
        showLoginPrompt();
        return;
      }

      if (
        axios.isAxiosError(error) &&
        error.response?.status === 404
      ) {
        setConversationId(null);
      }

      const errorMessage: ChatbotMessage = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: getErrorMessage(error),
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

  // 메시지나 로딩 표시가 추가되면 채팅 영역을 가장 아래로 이동한다.
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
                  선택한 감사 결과를 설명해 드려요.
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

          <div className="chatbot-audit-selector">
            <label htmlFor="chatbot-audit">
              질문할 감사
            </label>

            <select
              id="chatbot-audit"
              value={selectedAuditId ?? ''}
              onChange={handleAuditChange}
              disabled={
                isLoadingAudits || isSending
              }
            >
              <option value="">
                {isLoadingAudits
                  ? '감사 목록을 불러오는 중입니다.'
                  : '감사를 선택해 주세요.'}
              </option>

              {audits.map((audit) => (
                <option
                  key={audit.auditId}
                  value={audit.auditId}
                >
                  {/* auditId를 그대로 보여주면 사용자가 의미를 알 수 없어, 같은 모델의
                      여러 감사를 구분할 수 있도록 버전을 대신 붙인다. */}
                  {audit.version
                    ? `${audit.modelName} (${audit.version})`
                    : audit.modelName}
                </option>
              ))}
            </select>

            {auditLoadError && (
              <div className="chatbot-audit-error">
                <span>{auditLoadError}</span>

                <button
                  type="button"
                  onClick={() => {
                    void loadAudits();
                  }}
                  disabled={isLoadingAudits}
                >
                  다시 불러오기
                </button>
              </div>
            )}
          </div>

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
                    {selectedAuditId === null
                      ? '감사를 먼저 선택해 주세요.'
                      : '무엇을 도와드릴까요?'}
                  </strong>

                  <p>
                    {selectedAuditId === null
                      ? '완료된 감사를 선택하면 감사 결과에 대해 질문할 수 있습니다.'
                      : '공정성, 설명가능성, 주요 판단 근거와 관련 법령을 질문해 보세요.'}
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
                {message.role === 'assistant' && (
                  <div className="chatbot-message__avatar">
                    AI
                  </div>
                )}

                <div className="chatbot-message__content">
                  <div className="chatbot-message__bubble">
                    {message.content}
                  </div>

                  {message.role === 'assistant' &&
                    message.groundingStatus && (
                      <div className="chatbot-message__grounding">
                        근거 충실도:{' '}
                        {GROUNDING_STATUS_LABEL[
                          message.groundingStatus
                        ]}
                      </div>
                    )}
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
              placeholder={
                selectedAuditId === null
                  ? '감사를 먼저 선택해 주세요.'
                  : '궁금한 내용을 입력해 주세요.'
              }
              rows={1}
              maxLength={2000}
              disabled={
                isSending ||
                selectedAuditId === null
              }
              aria-label="챗봇 메시지 입력"
            />

            <button
              type="button"
              className="chatbot-send-button"
              onClick={() => {
                void handleSend();
              }}
              disabled={
                !input.trim() ||
                isSending ||
                selectedAuditId === null
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
          isOpen
            ? 'chatbot-toggle-button--open'
            : ''
        }`}
        onClick={handleToggle}
        aria-label={
          isOpen ? '챗봇 닫기' : '챗봇 열기'
        }
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