import './AuditOverviewSection.css';

type AuditStatus = '준수' | '주의' | '미충족';

interface RecentAudit {
  name: string;
  date: string;
  status: AuditStatus;
}

const RECENT_AUDITS: RecentAudit[] = [
  { name: 'A모델 v2 감사', date: '2026.07.06', status: '준수' },
  { name: 'B모델 v1 감사', date: '2026.07.02', status: '주의' },
  { name: 'A모델 v1 감사', date: '2026.06.28', status: '미충족' },
];

const STATUS_CLASS_NAME: Record<AuditStatus, string> = {
  준수: 'audit-overview-section__status--pass',
  주의: 'audit-overview-section__status--warn',
  미충족: 'audit-overview-section__status--fail',
};

function AuditOverviewSection() {
  return (
    <section className="audit-overview-section">
      <h2 className="audit-overview-section__title">로그인 후 진입 영역</h2>

      <div className="audit-overview-section__grid">
        <div className="audit-overview-section__card">
          <h3 className="audit-overview-section__card-title">
            최근 감사 이력
          </h3>

          <ul className="audit-overview-section__list">
            {RECENT_AUDITS.map((audit) => (
              <li
                key={audit.name}
                className="audit-overview-section__list-item"
              >
                <span className="audit-overview-section__list-name">
                  {audit.name}
                </span>
                <span className="audit-overview-section__list-date">
                  {audit.date}
                </span>
                <span
                  className={`audit-overview-section__status ${STATUS_CLASS_NAME[audit.status]}`}
                >
                  {audit.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="audit-overview-section__card">
          <h3 className="audit-overview-section__card-title">진행중 감사</h3>

          <div className="audit-overview-section__progress-track">
            <div
              className="audit-overview-section__progress-bar"
              style={{ width: '75%' }}
            />
          </div>

          <p className="audit-overview-section__progress-label">
            STEP 3 / 4 — RAG 법조문 매칭 중
          </p>
        </div>
      </div>
    </section>
  );
}

export default AuditOverviewSection;
