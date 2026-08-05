import { useState } from 'react';
import { Link } from 'react-router-dom';

import type {
  DashboardAuditStatus,
  RecentAudit,
} from '../../../../features/dashboard/api/dashboardApi';
import { formatModelVersion } from '../../../../features/dashboard/lib/formatModelVersion';

import './RecentAuditsSection.css';

interface RecentAuditsSectionProps {
  audits: RecentAudit[];
}

const AUDITS_PER_PAGE = 5;

const STATUS_LABELS: Record<DashboardAuditStatus, string> = {
  COMPLIANT: '충족',
  WARNING: '주의',
  NON_COMPLIANT: '추가 검토',
};

const RISK_METRIC_LABELS: Record<string, string> = {
  PROPORTIONAL_PARITY: '비례성 패리티',
  DEMOGRAPHIC_PARITY: '인구통계학적 평등성',
  EQUAL_OPPORTUNITY: '기회의 균등',
  EQUALIZED_ODDS: '균등화 승산',
  FPR_PARITY: '거짓 양성률 패리티',
  FDR_PARITY: '거짓 발견율 패리티',
  FOR_PARITY: '거짓 누락률 패리티',
  SENSITIVE_CONTRIB: '민감변수 기여비율',
  GLOBAL_STABILITY: '설명 일관성',
  FIDELITY: '설명 충실성',
};

function formatKeyRisk(keyRisk: string) {
  const translatedKeyRisk = keyRisk
    .split(/(\s+)/)
    .map((term) => RISK_METRIC_LABELS[term] ?? term)
    .join('');

  return translatedKeyRisk.replace(/(균등화 승산)\s+(-?\d+(?:\.\d+)?)/, '($1 $2)');
}

function formatCompletedAt(completedAt: string) {
  const date = new Date(completedAt);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replaceAll(' ', '');
}

function RecentAuditsContent({ audits }: RecentAuditsSectionProps) {
  const [visibleCount, setVisibleCount] = useState(AUDITS_PER_PAGE);
  const visibleAudits = audits.slice(0, visibleCount);
  const hasMore = visibleCount < audits.length;
  const canCollapse = visibleCount > AUDITS_PER_PAGE;

  const handleLoadMore = () => {
    setVisibleCount((currentCount) => Math.min(currentCount + AUDITS_PER_PAGE, audits.length));
  };

  const handleCollapse = () => {
    setVisibleCount(AUDITS_PER_PAGE);
  };

  return (
    <section className="recent-audits">
      <h2 className="recent-audits__title">감사 내역</h2>

      <div className="recent-audits__table-card">
        {audits.length > 0 ? (
          <div className="recent-audits__table-scroll">
            <table className="recent-audits__table">
              <thead>
                <tr>
                  <th scope="col">모델명</th>
                  <th scope="col">종합판정</th>
                  <th scope="col">핵심 위험 신호</th>
                  <th scope="col">완료일</th>
                  <th scope="col">상세</th>
                </tr>
              </thead>
              <tbody>
                {visibleAudits.map((audit) => {
                  const keyRiskLabel = formatKeyRisk(audit.keyRisk);

                  return (
                    <tr key={audit.auditId}>
                      <td className="recent-audits__model">
                        {audit.modelName}
                        {audit.version && (
                          <span className="recent-audits__model-version">
                            {formatModelVersion(audit.version)}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`recent-audits__status recent-audits__status--${audit.status.toLowerCase()}`}
                        >
                          {STATUS_LABELS[audit.status]}
                        </span>
                      </td>
                      <td className="recent-audits__risk" title={keyRiskLabel}>
                        {keyRiskLabel}
                      </td>
                      <td className="recent-audits__date">
                        {formatCompletedAt(audit.completedAt)}
                      </td>
                      <td>
                        <Link
                          to={`/audit/${audit.auditId}/results`}
                          className="recent-audits__detail-link"
                        >
                          상세보기 ›
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="recent-audits__empty">완료된 감사 내역이 없습니다.</div>
        )}

        {(canCollapse || hasMore) && (
          <div className="recent-audits__load-more-area">
            {canCollapse && (
              <button
                type="button"
                className="recent-audits__load-more-button"
                onClick={handleCollapse}
              >
                <span>접기</span>
                <span
                  className="recent-audits__load-more-icon recent-audits__load-more-icon--up"
                  aria-hidden="true"
                >
                  ↑
                </span>
              </button>
            )}

            {hasMore && (
              <button
                type="button"
                className="recent-audits__load-more-button"
                onClick={handleLoadMore}
              >
                <span>더 보기</span>
                <span
                  className="recent-audits__load-more-icon recent-audits__load-more-icon--down"
                  aria-hidden="true"
                >
                  ↓
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function RecentAuditsSection({ audits }: RecentAuditsSectionProps) {
  const auditListKey = audits.map((audit) => audit.auditId).join(',');

  return <RecentAuditsContent key={auditListKey} audits={audits} />;
}

export default RecentAuditsSection;
