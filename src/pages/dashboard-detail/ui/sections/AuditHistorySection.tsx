import { message } from 'antd';

import type { AuditSummary } from '../../../../features/audit/api/auditApi';

import { formatAuditDate, STATUS_LABEL } from './auditStatusMeta';
import './AuditHistorySection.css';

interface AuditHistorySectionProps {
  audits: AuditSummary[];
  currentAuditId: number;
  isLoading: boolean;
}

function handleCompareClick() {
  // TODO: 감사 이력 비교 기능 개발 후 실제 동작으로 교체 필요
  message.info('비교 기능은 추후에 개발 예정입니다.');
}

function AuditHistorySection({ audits, currentAuditId, isLoading }: AuditHistorySectionProps) {
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
              >
                <span
                  className={`audit-history-section__model-name${isCurrent ? ' audit-history-section__model-name--current' : ''}`}
                >
                  {audit.modelName}
                </span>
                <span className="audit-history-section__date">
                  {formatAuditDate(audit.completedAt)}
                </span>
                <span className="audit-history-section__summary">
                  {STATUS_LABEL[audit.status]}
                  {isCurrent && ' · 현재'}
                </span>
                <button
                  type="button"
                  className="audit-history-section__link"
                  onClick={handleCompareClick}
                >
                  비교 보기
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default AuditHistorySection;
