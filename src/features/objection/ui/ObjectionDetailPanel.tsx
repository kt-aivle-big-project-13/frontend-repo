import {
  CheckOutlined,
  CloseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';

import { maskEmail } from '../lib/maskEmail';
import type {
  ObjectionDetail,
  ObjectionReviewResult,
} from '../model/objectionTypes';

// 상세 패널에서 전달받는 값과 이벤트
interface ObjectionDetailPanelProps {
  objection: ObjectionDetail;
  reviewResult: ObjectionReviewResult;
  onReviewResultChange: (value: ObjectionReviewResult) => void;
  onClose: () => void;
  onCreateDocument: () => void;
}

// 작성일시 표시 형식 변환
function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date(value))
    .replaceAll(' ', '');
}

// 최종 처리 결과 한글 변환
function getReviewResultLabel(
  value: ObjectionReviewResult,
): string {
  return value === 'REJECTED'
    ? '거절 유지'
    : '재심사';
}

function ObjectionDetailPanel({
  objection,
  reviewResult,
  onReviewResultChange,
  onClose,
  onCreateDocument,
}: ObjectionDetailPanelProps) {
  // 답변완료 상태 확인
  const isCompleted = objection.status === 'COMPLETED';

  return (
    <section className="objection-detail">
      {/* 상세 패널 상단 정보 */}
      <header className="objection-detail__header">
        <div>
          <h2>{objection.customerName}*</h2>

          {/* 이의제기 유형 및 고영향 AI 배지 */}
          <div className="objection-detail__tags">
            <span className="objection-detail__case-tag">
              {objection.caseType}
            </span>

            {objection.highImpactAi && (
              <span className="objection-detail__ai-tag">
                고영향 AI
              </span>
            )}
          </div>
        </div>

        {/* 이의제기 번호 및 작성일시 */}
        <div className="objection-detail__meta">
          <p>
            이의제기 <strong>#{objection.objectionNo}</strong>
          </p>

          <p>
            작성일시{' '}
            <time>{formatDateTime(objection.createdAt)}</time>
          </p>
        </div>

        {/* 상세 패널 닫기 버튼 */}
        <button
          type="button"
          className="objection-detail__close"
          aria-label="상세 닫기"
          onClick={onClose}
        >
          <CloseOutlined />
        </button>
      </header>

      {/* 상단 구분선 */}
      <div className="objection-detail__divider" />

      {/* 고객 제기 내용 */}
      <section className="objection-detail__customer-content">
        <h3>
          <span className="objection-detail__question-icon">Q</span>
          고객 제기 내용
        </h3>

        {/* 이의제기 제목 */}
        <div className="objection-detail__content-field">
          <strong className="objection-detail__field-label">
            제목
          </strong>

          <div className="objection-detail__title-box">
            {objection.title || '아직 작성된 제목이 없습니다.'}
          </div>
        </div>

        {/* 이의제기 내용 */}
        <div className="objection-detail__content-field">
          <strong className="objection-detail__field-label">
            내용
          </strong>

          <div className="objection-detail__content-box">
            {objection.content || '아직 작성된 내용이 없습니다.'}
          </div>
        </div>
      </section>

      {/* SHAP 판단 근거 영역 */}
      <section className="objection-detail__analysis">
        {/* 주요 판단 근거 변수 제목 */}
        <p className="objection-detail__analysis-label">
          주요 판단 근거
        </p>

        {/* 주요 판단 근거 변수 목록 */}
        <div className="objection-detail__contributors">
          {objection.contributors.length === 0 ? (
            <span className="objection-detail__no-contributor">
              연결된 판단 근거가 없습니다.
            </span>
          ) : (
            objection.contributors.map((contributor) => (
              <span
                key={contributor.feature}
                className={`objection-detail__contributor objection-detail__contributor--${contributor.level.toLowerCase()}`}
              >
                <span
                  className="objection-detail__contributor-dot"
                  aria-hidden="true"
                />

                {contributor.label}{' '}
                <strong>{contributor.value}</strong>
              </span>
            ))
          )}
        </div>

        {/* 담당자 판단 근거 제목 */}
        <div className="objection-detail__basis-heading">
          <span>담당자 판단 근거</span>
          <span>✦ 자동작성</span>
        </div>

        {/* 담당자 판단 근거 내용 */}
        <div className="objection-detail__basis">
          {objection.reviewBasis ||
            '자동 생성된 판단 근거가 없습니다.'}
        </div>
      </section>

      {isCompleted ? (
        <>
          {/* 답변완료 안내 */}
          <div className="objection-detail__completed-notice">
            <CheckOutlined />
            <span>이미 답변이 발송된 이의제기입니다.</span>
          </div>

          {/* 완료된 처리 결과 및 이메일 발송 정보 */}
          <section className="objection-detail__completed">
            <p className="objection-detail__completed-title">
              최종 처리 결과
            </p>

            {objection.completionInfo ? (
              <>
                <div className="objection-detail__completed-result">
                  <strong>
                    {getReviewResultLabel(
                      objection.completionInfo.reviewResult,
                    )}
                  </strong>

                  <span>고객 안내문 이메일 발송 완료</span>
                </div>

                <dl className="objection-detail__dispatch-info">
                  <div>
                    <dt>발송일시</dt>
                    <dd>
                      {formatDateTime(
                        objection.completionInfo.dispatchedAt,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>고객 이름</dt>
                    <dd>{objection.customerName}</dd>
                  </div>

                  <div>
                    <dt>수신 이메일</dt>
                    <dd>
                      {maskEmail(
                        objection.completionInfo.recipientEmail,
                      )}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <div className="objection-detail__completed-empty">
                이메일 발송 정보를 확인할 수 없습니다.
              </div>
            )}
          </section>

          {/* 발송된 대응문서 확인 버튼 */}
          <button
            type="button"
            className="objection-detail__view-button"
            onClick={onCreateDocument}
          >
            <FileTextOutlined />
            발송된 대응문서 보기
          </button>
        </>
      ) : (
        <>
          {/* 심사대기 건의 최종 처리 결과 선택 */}
          <section className="objection-detail__decision">
            <p>거절 유지를 할지 재심사 할지 선택해주세요</p>

            <div className="objection-detail__decision-options">
              {/* 거절 유지 버튼 */}
              <button
                type="button"
                className={`objection-detail__decision-button objection-detail__decision-button--reject ${
                  reviewResult === 'REJECTED'
                    ? 'objection-detail__decision-button--selected'
                    : ''
                }`}
                onClick={() => onReviewResultChange('REJECTED')}
              >
                <strong>거절 유지</strong>
                <span>현재 판정 근거로 대응문서 생성</span>
              </button>

              {/* 재심사 버튼 */}
              <button
                type="button"
                className={`objection-detail__decision-button objection-detail__decision-button--review ${
                  reviewResult === 'RE_REVIEW'
                    ? 'objection-detail__decision-button--selected'
                    : ''
                }`}
                onClick={() => onReviewResultChange('RE_REVIEW')}
              >
                <strong>재심사</strong>
                <span>추가 자료 요청 후 재판정</span>
              </button>
            </div>
          </section>

          {/* 대응문서 생성 버튼 */}
          <button
            type="button"
            className="objection-detail__create-button"
            disabled={!objection.title}
            onClick={onCreateDocument}
          >
            <FileTextOutlined />
            문서 생성하기
          </button>
        </>
      )}
    </section>
  );
}

export default ObjectionDetailPanel;