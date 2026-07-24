import AuthGatedLink from '../../../../entities/user/ui/AuthGatedLink';
import { useAuthStore } from '../../../../entities/user/model/authStore';

import './AuditOverviewSection.css';

type AuditStatus = '준수' | '주의' | '미충족';

interface RecentAudit {
  name: string;
  date: string;
  status: AuditStatus;
}

interface InProgressAudit {
  step: number;
  totalSteps: number;
  label: string;
}

// 비로그인 시 데모 미리보기용 더미 데이터. 실제 로그인 계정은 아직
// 감사 이력 API가 없어서 빈 상태로 처리(가짜 데이터를 실제 계정 것처럼
// 보여주면 안 되기 때문).
const DEMO_RECENT_AUDITS: RecentAudit[] = [
  { name: 'A모델 v2 감사', date: '2026.07.06', status: '준수' },
  { name: 'B모델 v1 감사', date: '2026.07.02', status: '주의' },
  { name: 'A모델 v1 감사', date: '2026.06.28', status: '미충족' },
];

const DEMO_IN_PROGRESS_AUDIT: InProgressAudit = {
  step: 3,
  totalSteps: 4,
  label: 'RAG 법조문 매칭 중',
};

const STATUS_CLASS_NAME: Record<AuditStatus, string> = {
  준수: 'audit-overview-section__status--pass',
  주의: 'audit-overview-section__status--warn',
  미충족: 'audit-overview-section__status--fail',
};

function AuditOverviewSection() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.user));

  // 로그인 계정의 실제 감사 이력 API가 아직 없어서, 로그인 시에는
  // 빈 상태로 두고 비로그인일 때만 데모 데이터를 보여줌.
  const recentAudits = isAuthenticated ? [] : DEMO_RECENT_AUDITS;
  const inProgressAudit = isAuthenticated ? null : DEMO_IN_PROGRESS_AUDIT;

  return (
    <section className="audit-overview-section">
      <h2 className="audit-overview-section__title">
        {isAuthenticated ? '최근 감사' : '로그인 후 진입 영역'}
      </h2>

      <div className="audit-overview-section__grid">
        <div className="audit-overview-section__card">
          <h3 className="audit-overview-section__card-title">
            최근 감사 이력
          </h3>

          {recentAudits.length === 0 ? (
            <p className="audit-overview-section__empty">
              최근 감사 이력이 없습니다.
            </p>
          ) : (
            <ul className="audit-overview-section__list">
              {recentAudits.map((audit) => (
                <li key={audit.name}>
                  <AuthGatedLink
                    to="/pre-diagnosis"
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
                  </AuthGatedLink>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="audit-overview-section__card">
          <h3 className="audit-overview-section__card-title">진행중 감사</h3>

          {inProgressAudit === null ? (
            <p className="audit-overview-section__empty">
              진행중인 감사가 없습니다.
            </p>
          ) : (
            <AuthGatedLink
              to="/pre-diagnosis"
              className="audit-overview-section__progress"
            >
              <div className="audit-overview-section__progress-track">
                <div
                  className="audit-overview-section__progress-bar"
                  style={{
                    width: `${(inProgressAudit.step / inProgressAudit.totalSteps) * 100}%`,
                  }}
                />
              </div>

              <p className="audit-overview-section__progress-label">
                STEP {inProgressAudit.step} / {inProgressAudit.totalSteps}{' '}
                — {inProgressAudit.label}
              </p>
            </AuthGatedLink>
          )}
        </div>
      </div>
    </section>
  );
}

export default AuditOverviewSection;
