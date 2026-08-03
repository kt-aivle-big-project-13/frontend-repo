import { CheckOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons';

import { maskEmail } from '../lib/maskEmail';
import type { ObjectionDetail, ObjectionReviewResult } from '../model/objectionTypes';

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
function getReviewResultLabel(value: ObjectionReviewResult): string {
  return value === 'REJECTED' ? '거절 유지' : '재심사';
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

  // 전역 SHAP 근거를 순위순으로 정렬한 뒤 TOP 5만 표시
  const topModelEvidence = [...(objection.globalModelEvidence ?? [])]
    .sort((first, second) => first.rank - second.rank)
    .slice(0, 5);

  return (
    <section className="objection-detail">
      {/* 상세 패널 상단 정보 */}
      <header className="objection-detail__header">
        <div>
          <h2>{objection.customerName}*</h2>

          {/* 이의제기 유형 및 고영향 AI 배지 */}
          <div className="objection-detail__tags">
            <span className="objection-detail__case-tag">{objection.caseType}</span>

            {objection.highImpactAi && <span className="objection-detail__ai-tag">고영향 AI</span>}
          </div>
        </div>

        {/* 이의제기 번호 및 작성일시 */}
        <div className="objection-detail__meta">
          <p>
            이의제기 <strong>#{objection.objectionNo}</strong>
          </p>

          <p>
            작성일시 <time>{formatDateTime(objection.createdAt)}</time>
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
          <strong className="objection-detail__field-label">제목</strong>

          <div className="objection-detail__title-box">
            {objection.title || '아직 작성된 제목이 없습니다.'}
          </div>
        </div>

        {/* 이의제기 내용 */}
        <div className="objection-detail__content-field">
          <strong className="objection-detail__field-label">내용</strong>

          <div className="objection-detail__content-box">
            {objection.content || '아직 작성된 내용이 없습니다.'}
          </div>
        </div>
      </section>

      {/* 고객 건별 근거와 모델 전역 SHAP 판단 경향 */}
      <section className="objection-detail__analysis">
        <p className="objection-detail__analysis-label">고객 건별 심사 근거</p>

        <div className="objection-detail__contributors">
          {objection.contributors.length === 0 ? (
            <span className="objection-detail__no-contributor">
              등록된 고객 건별 근거가 없습니다.
            </span>
          ) : (
            objection.contributors.map((contributor) => (
              <span key={contributor.feature} className="objection-detail__contributor">
                <span className="objection-detail__contributor-dot" aria-hidden="true" />
                {contributor.label} <strong>{contributor.value}</strong>
              </span>
            ))
          )}
        </div>

        <div className="objection-detail__model-evidence-heading">
          <span>모델 전체 판단 경향</span>
          {objection.modelName && <strong>{objection.modelName}</strong>}
        </div>

        {topModelEvidence.length ? (
          <div className="objection-detail__model-evidence-list">
            {topModelEvidence.map((evidence) => (
              <div
                key={`${evidence.rank}-${evidence.feature}`}
                className="objection-detail__model-evidence-item"
              >
                <span className="objection-detail__model-evidence-rank">{evidence.rank}</span>

                <div className="objection-detail__model-evidence-name">
                  <strong>{evidence.displayName}</strong>
                  <span>{evidence.feature}</span>
                </div>

                <span className="objection-detail__model-evidence-ratio">
                  {(evidence.contributionRatio * 100).toFixed(1)}%
                </span>

                <span
                  className={[
                    'objection-detail__model-evidence-direction',
                    evidence.direction === 'RISK_INCREASE'
                      ? 'objection-detail__model-evidence-direction--increase'
                      : evidence.direction === 'RISK_DECREASE'
                        ? 'objection-detail__model-evidence-direction--decrease'
                        : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {evidence.direction === 'RISK_INCREASE'
                    ? '위험 증가 경향'
                    : evidence.direction === 'RISK_DECREASE'
                      ? '위험 감소 경향'
                      : '방향 정보 없음'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="objection-detail__model-evidence-empty">
            완료된 감사의 전역 SHAP 판단 경향이 없습니다.
          </div>
        )}

        <p className="objection-detail__model-evidence-notice">
          모델 전체 감사 데이터에서 확인된 일반적인 판단 경향이며, 해당 고객의 개별 거절 원인을 직접
          의미하지 않습니다.
        </p>

        <div className="objection-detail__basis-heading">
          <span>담당자 판단 근거</span>
        </div>

        <div className="objection-detail__basis">
          {objection.reviewBasis || '등록된 담당자 판단 근거가 없습니다.'}
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
            <p className="objection-detail__completed-title">최종 처리 결과</p>

            {objection.completionInfo ? (
              <>
                <div className="objection-detail__completed-result">
                  <strong>{getReviewResultLabel(objection.completionInfo.reviewResult)}</strong>

                  <span>고객 안내문 이메일 발송 완료</span>
                </div>

                <dl className="objection-detail__dispatch-info">
                  <div>
                    <dt>발송일시</dt>
                    <dd>{formatDateTime(objection.completionInfo.dispatchedAt)}</dd>
                  </div>

                  <div>
                    <dt>고객 이름</dt>
                    <dd>{objection.customerName}</dd>
                  </div>

                  <div>
                    <dt>수신 이메일</dt>
                    <dd>{maskEmail(objection.completionInfo.recipientEmail)}</dd>
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
                  reviewResult === 'REJECTED' ? 'objection-detail__decision-button--selected' : ''
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
                  reviewResult === 'RE_REVIEW' ? 'objection-detail__decision-button--selected' : ''
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
