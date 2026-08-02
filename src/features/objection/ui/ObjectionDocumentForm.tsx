import { useState } from 'react';
import { ReloadOutlined } from '@ant-design/icons';
import { Button, Checkbox, Input, Modal, message } from 'antd';

import { maskEmail } from '../lib/maskEmail';
import type {
  ObjectionDocument,
  ObjectionReviewResult,
} from '../model/objectionTypes';

// 이메일 형식 검증용 정규식 (간단한 형식 확인 용도)
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 대응문서 폼에서 전달받는 값과 이벤트
interface ObjectionDocumentFormProps {
  document: ObjectionDocument;
  letterBody: string;
  isCompleted: boolean;
  isDirectInput: boolean;
  agreed: boolean;
  isRegenerating: boolean;
  isDispatching: boolean;
  onLetterBodyChange: (value: string) => void;
  onDirectInputChange: (checked: boolean) => void;
  onAgreementChange: (checked: boolean) => void;
  onRegenerate: () => void;
  onDispatch: (recipientEmail: string) => void;
}

// 처리 결과 코드를 한글 문구로 변환
function getReviewResultLabel(
  value: ObjectionReviewResult,
): string {
  return value === 'REJECTED' ? '거절 유지' : '재심사';
}

function ObjectionDocumentForm({
  document,
  letterBody,
  isCompleted,
  isDirectInput,
  agreed,
  isRegenerating,
  isDispatching,
  onLetterBodyChange,
  onDirectInputChange,
  onAgreementChange,
  onRegenerate,
  onDispatch,
}: ObjectionDocumentFormProps) {
  // 1단계: 수신 이메일 입력 모달
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // 2단계: 최종 발송 확인 모달 (실제 발송에는 원본 이메일을, 화면 표시에는 마스킹된 값을 쓴다)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState('');

  const isEmailValid = EMAIL_PATTERN.test(emailInput.trim());

  // 발송 버튼 클릭 시 이메일 입력 모달을 연다
  const handleOpenEmailModal = () => {
    if (isCompleted) {
      message.warning('이미 발송이 완료된 대응문서입니다.');
      return;
    }

    if (!letterBody.trim()) {
      message.warning('고객 안내문 내용을 입력해 주세요.');
      return;
    }

    if (!agreed) {
      message.warning('내용 검토 및 발송 동의가 필요합니다.');
      return;
    }

    setEmailInput('');
    setIsEmailModalOpen(true);
  };

  // 이메일 입력 확인 -> 최종 발송 확인 모달로 전환
  const handleConfirmEmail = () => {
    const trimmedEmail = emailInput.trim();

    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      message.warning('올바른 이메일 주소를 입력해 주세요.');
      return;
    }

    setConfirmedEmail(trimmedEmail);
    setIsEmailModalOpen(false);
    setIsConfirmModalOpen(true);
  };

  // 최종 확인 -> 실제 발송 (원본 이메일로 전송)
  const handleFinalConfirm = () => {
    setIsConfirmModalOpen(false);
    onDispatch(confirmedEmail);
  };

  return (
    <section className="objection-document-form">
      {/* 대응문서 검토 카드 상단 */}
      <header className="objection-document-form__header">
        <h2>
          {isCompleted
            ? '③ 발송된 설명문 확인'
            : '③ 설명문 초안 — 담당자 검토'}
        </h2>

        <span>
          처리 결과: {getReviewResultLabel(document.reviewResult)}
        </span>
      </header>

      {/* 카드 상단 구분선 */}
      <div className="objection-document-form__divider" />

      {/* 판단 근거 설명 영역 */}
      <div className="objection-document-form__field">
        <div className="objection-document-form__label">
          <span>판단 근거 설명 (SHAP, If-Then)</span>
          <small>✦ 자동 작성</small>
        </div>

        <div className="objection-document-form__explanation">
          {document.explanation}
        </div>
      </div>

      {/* 고객 안내문 영역 */}
      <div className="objection-document-form__field">
        <div className="objection-document-form__label-row">
          <div className="objection-document-form__label">
            <span>
              {isCompleted
                ? '발송된 고객 안내문'
                : '고객 안내문 초안 (LLM)'}
            </span>

            <small>
              {isCompleted ? '✦ 발송 완료' : '✦ 자동 초안'}
            </small>
          </div>

          {/* 답변대기 건에서만 직접입력 및 재생성 표시 */}
          {!isCompleted && (
            <div className="objection-document-form__controls">
              <Checkbox
                checked={isDirectInput}
                onChange={(event) =>
                  onDirectInputChange(event.target.checked)
                }
              >
                직접입력
              </Checkbox>

              <Button
                icon={<ReloadOutlined />}
                loading={isRegenerating}
                onClick={onRegenerate}
              >
                재생성
              </Button>
            </div>
          )}
        </div>

        {/* 고객 안내문 */}
        <Input.TextArea
          className={[
            'objection-document-form__letter',
            isCompleted
              ? 'objection-document-form__letter--completed'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          value={letterBody}
          readOnly={isCompleted || !isDirectInput}
          onChange={(event) => {
            if (isCompleted) {
              return;
            }

            onLetterBodyChange(event.target.value);
            onAgreementChange(false);
          }}
        />
      </div>

      {isCompleted ? (
        /* 답변완료 문서 안내 */
        <div className="objection-document-form__readonly-notice">
          이미 고객 이메일로 발송된 대응문서입니다. 내용은 수정하거나
          재발송할 수 없습니다.
        </div>
      ) : (
        /* 발송 동의 및 발송 버튼 */
        <div className="objection-document-form__actions">
          <Checkbox
            checked={agreed}
            disabled={!letterBody.trim()}
            onChange={(event) =>
              onAgreementChange(event.target.checked)
            }
          >
            내용을 검토했으며 발송에 동의합니다.
          </Checkbox>

          <Button
            type="primary"
            loading={isDispatching}
            disabled={!agreed || !letterBody.trim()}
            onClick={handleOpenEmailModal}
          >
            발송
          </Button>
        </div>
      )}

      {/* 1단계: 수신 이메일 입력 모달 */}
      <Modal
        title="수신 이메일 입력"
        open={isEmailModalOpen}
        okText="확인"
        cancelText="취소"
        okButtonProps={{ disabled: !isEmailValid }}
        onOk={handleConfirmEmail}
        onCancel={() => setIsEmailModalOpen(false)}
      >
        <p>고객에게 발송할 이메일 주소를 입력하세요.</p>

        <Input
          type="email"
          value={emailInput}
          placeholder="example@email.com"
          status={
            emailInput.trim() && !isEmailValid ? 'error' : undefined
          }
          onChange={(event) => setEmailInput(event.target.value)}
          onPressEnter={handleConfirmEmail}
          autoFocus
        />

        {emailInput.trim() && !isEmailValid && (
          <span className="objection-document-form__email-error">
            이메일 형식이 올바르지 않습니다.
          </span>
        )}
      </Modal>

      {/* 2단계: 최종 발송 확인 모달 */}
      <Modal
        title="발송 확인"
        open={isConfirmModalOpen}
        okText="예"
        cancelText="아니오"
        confirmLoading={isDispatching}
        onOk={handleFinalConfirm}
        onCancel={() => setIsConfirmModalOpen(false)}
      >
        <p>
          <strong>{maskEmail(confirmedEmail)}</strong>(으)로 대응문서를
          발송합니다.
        </p>
        <p>정말 발송하시겠습니까?</p>
      </Modal>
    </section>
  );
}

export default ObjectionDocumentForm;