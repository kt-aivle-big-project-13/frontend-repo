import { Link } from 'react-router-dom';

import type {
  DashboardAuditStatus,
  RecentAudit,
} from '../../../../features/dashboard/api/dashboardApi';

import './RecentAuditsSection.css';

interface RecentAuditsSectionProps {
  audits: RecentAudit[];
}

const STATUS_LABELS: Record<DashboardAuditStatus, string> = {
  COMPLIANT: '정상',
  WARNING: '검토 필요',
  NON_COMPLIANT: '기준 초과',
};

function formatAuditId(auditId: number) {
  return `A${String(auditId).padStart(4, '0')}`;
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

function RecentAuditsSection({ audits }: RecentAuditsSectionProps) {
  return (
    <section className="recent-audits">
      <h2 className="recent-audits__title">감사 내역</h2>

      <div className="recent-audits__table-card">
        {audits.length > 0 ? (
          <div className="recent-audits__table-scroll">
            <table className="recent-audits__table">
              <thead>
                <tr>
                  <th scope="col">감사 ID</th>
                  <th scope="col">모델명</th>
                  <th scope="col">종합판정</th>
                  <th scope="col">핵심 위험 신호</th>
                  <th scope="col">완료일</th>
                  <th scope="col">상세</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr key={audit.auditId}>
                    <td className="recent-audits__id">{formatAuditId(audit.auditId)}</td>
                    <td className="recent-audits__model">{audit.modelName}</td>
                    <td>
                      <span
                        className={`recent-audits__status recent-audits__status--${audit.status.toLowerCase()}`}
                      >
                        {STATUS_LABELS[audit.status]}
                      </span>
                    </td>
                    <td className="recent-audits__risk" title={audit.keyRisk}>
                      {audit.keyRisk}
                    </td>
                    <td className="recent-audits__date">{formatCompletedAt(audit.completedAt)}</td>
                    <td>
                      <Link
                        to={`/audit/${audit.auditId}/results`}
                        className="recent-audits__detail-link"
                      >
                        상세보기 ›
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="recent-audits__empty">완료된 감사 내역이 없습니다.</div>
        )}
      </div>
    </section>
  );
}

export default RecentAuditsSection;
