import type { KeyboardEvent, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import type { AuditSummary } from '../../../../features/audit/api/auditApi';

import { formatAuditDate, STATUS_BG_COLOR, STATUS_LABEL, STATUS_TEXT_COLOR } from './auditStatusMeta';
import './VersionHistorySection.css';

interface VersionHistorySectionProps {
  audits: AuditSummary[];
  currentAuditId: number;
  isLoading: boolean;
}

function VersionHistorySection({ audits, currentAuditId, isLoading }: VersionHistorySectionProps) {
  const navigate = useNavigate();

  // 행 자체의 클릭(감사 결과 이동)으로 이벤트가 전파되지 않도록 막고, 지금 보고 있는 감사와
  // 클릭한 행의 감사를 비교 화면으로 넘긴다. 어느 쪽이 더 최신인지는 비교 화면에서
  // completedAt 기준으로 다시 정렬하므로 여기서는 순서를 신경 쓰지 않아도 된다.
  const handleCompareClick = (event: MouseEvent, targetAuditId: number) => {
    event.stopPropagation();
    navigate(`/audit/${currentAuditId}/compare?with=${targetAuditId}`);
  };

  // 마우스 클릭은 위에서 stopPropagation으로 막지만, 키보드로 이 버튼을 조작할 때(Enter/Space)
  // 발생하는 keydown은 별개 이벤트라 여기서 따로 막아야 한다 — 안 막으면 keydown이 li까지
  // 버블링돼 li의 onKeyDown이 결과 페이지로 이동시켜버려서, 키보드 사용자는 비교 화면을
  // 열지 못하고 결과 페이지로 튕겨나간다.
  const stopKeyDownPropagation = (event: KeyboardEvent) => {
    event.stopPropagation();
  };

  return (
    <section className="version-history-section">
      <h2 className="version-history-section__title">버전 이력</h2>

      {isLoading ? (
        <p className="version-history-section__status">불러오는 중…</p>
      ) : audits.length === 0 ? (
        <p className="version-history-section__status">비교할 이전 버전이 없습니다.</p>
      ) : (
        <ul className="version-history-section__list">
          {audits.map((audit) => {
            const isCurrent = audit.auditId === currentAuditId;

            return (
              <li
                key={audit.auditId}
                className={`version-history-section__row${isCurrent ? ' version-history-section__row--current' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/audit/${audit.auditId}/results`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/audit/${audit.auditId}/results`);
                  }
                }}
              >
                <span
                  className={`version-history-section__version${isCurrent ? ' version-history-section__version--current' : ''}`}
                >
                  {audit.modelName}
                  {audit.version && (
                    <span className="version-history-section__version-tag"> {audit.version}</span>
                  )}
                </span>
                <span className="version-history-section__date">
                  {formatAuditDate(audit.completedAt)}
                </span>
                <span
                  className="version-history-section__status-badge"
                  style={{
                    backgroundColor: STATUS_BG_COLOR[audit.status],
                    color: STATUS_TEXT_COLOR[audit.status],
                  }}
                >
                  {STATUS_LABEL[audit.status]}
                </span>
                {!isCurrent && (
                  <button
                    type="button"
                    className="version-history-section__link"
                    onClick={(event) => handleCompareClick(event, audit.auditId)}
                    onKeyDown={stopKeyDownPropagation}
                  >
                    비교 보기
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default VersionHistorySection;