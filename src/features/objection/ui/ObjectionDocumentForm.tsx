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
        <h2>③ 설명문 초안 — 담당자 검토</h2>

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
            <span>고객 안내문 초안 (LLM)</span>
            <small>✦ 자동 초안</small>
          </div>

          {/* 직접입력 및 재생성 기능 */}
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
        </div>

        {/* 고객에게 발송할 안내문 */}
        <Input.TextArea
          className="objection-document-form__letter"
          value={letterBody}
          readOnly={!isDirectInput}
          onChange={(event) => {
            onLetterBodyChange(event.target.value);
            onAgreementChange(false);
          }}
        />
      </div>

      {/* 발송 동의 및 발송 버튼 */}
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
    </section>
  );
}

export default ObjectionDocumentForm;