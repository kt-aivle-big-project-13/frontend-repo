import { ReloadOutlined } from '@ant-design/icons';
import { Button, Checkbox, Input, message } from 'antd';

import type {
  ObjectionDocument,
  ObjectionReviewResult,
} from '../model/objectionTypes';

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
  onDispatch: () => void;
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
  // 고객 안내문 발송 전 유효성 검사
  const handleDispatch = () => {
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

    onDispatch();
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
            onClick={handleDispatch}
          >
            발송
          </Button>
        </div>
      )}
    </section>
  );
}

export default ObjectionDocumentForm;