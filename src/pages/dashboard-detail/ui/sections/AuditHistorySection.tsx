import { useNavigate } from 'react-router-dom';

import type { AuditSummary } from '../../../../features/audit/api/auditApi';

import { formatAuditDate, STATUS_BG_COLOR, STATUS_LABEL, STATUS_TEXT_COLOR } from './auditStatusMeta';
import './AuditHistorySection.css';

interface AuditHistorySectionProps {
  audits: AuditSummary[];
  currentAuditId: number;
  isLoading: boolean;
}

function AuditHistorySection({ audits, currentAuditId, isLoading }: AuditHistorySectionProps) {
  const navigate = useNavigate();

  return (
    <section className="audit-history-section">
      <h2 className="audit-history-section__title">감사 이력</h2>

      {isLoading ? (
        <p className="audit-history-section__status">불러오는 중…</p>
      ) : audits.length === 0 ? (
        <p className="audit-history-section__status">아직 완료된 감사 이력이 없습니다.</p>
      ) : (
        <ul className="audit-history-section__list">
          {audits.map((audit) => {
            const isCurrent = audit.auditId === currentAuditId;

            return (
              <li
                key={audit.auditId}
                className={`audit-history-section__row${isCurrent ? ' audit-history-section__row--current' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/dashboard/${audit.auditId}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/dashboard/${audit.auditId}`);
                  }
                }}
              >
                <span
                  className={`audit-history-section__model-name${isCurrent ? ' audit-history-section__model-name--current' : ''}`}
                >
                  {audit.modelName}
                  {audit.version && (
                    <span className="audit-history-section__version-tag"> {audit.version}</span>
                  )}
                </span>
                <span className="audit-history-section__date">
                  {formatAuditDate(audit.completedAt)}
                </span>
                <span className="audit-history-section__summary">
                  <span
                    className="audit-history-section__status-badge"
                    style={{
                      backgroundColor: STATUS_BG_COLOR[audit.status],
                      color: STATUS_TEXT_COLOR[audit.status],
                    }}
                  >
                    {STATUS_LABEL[audit.status]}
                  </span>
                  {isCurrent && ' · 현재'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default AuditHistorySection;
