import { message } from 'antd';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import type { AuditSummary } from '../../../../features/audit/api/auditApi';

import { formatAuditDate, STATUS_BG_COLOR, STATUS_LABEL, STATUS_TEXT_COLOR } from './auditStatusMeta';
import './VersionHistorySection.css';

interface VersionHistorySectionProps {
  audits: AuditSummary[];
  currentAuditId: number;
  isLoading: boolean;
}

function handleCompareClick(event: MouseEvent) {
  // 행 자체의 클릭(감사 결과 이동)으로 이벤트가 전파되지 않도록 막는다.
  event.stopPropagation();
  // TODO: 버전 비교 기능 개발 후 실제 동작으로 교체 필요
  message.info('비교 기능은 추후에 개발 예정입니다.');
}

function VersionHistorySection({ audits, currentAuditId, isLoading }: VersionHistorySectionProps) {
  const navigate = useNavigate();

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
                    onClick={handleCompareClick}
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