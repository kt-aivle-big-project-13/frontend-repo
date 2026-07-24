import AuthGatedLink from '../../../../entities/user/ui/AuthGatedLink';
import { useAuthStore } from '../../../../entities/user/model/authStore';
import { useLoginPromptStore } from '../../../../entities/user/model/loginPromptStore';

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

const LOCKED_MESSAGE = '로그인 후 이용 가능합니다';

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect
        x="4.5"
        y="9"
        width="11"
        height="8"
        rx="1.5"
        stroke="#2d67e8"
        strokeWidth="1.4"
      />
      <path
        d="M6.5 9V6.5C6.5 4.567 8.067 3 10 3C11.933 3 13.5 4.567 13.5 6.5V9"
        stroke="#2d67e8"
        strokeWidth="1.4"
      />
      <circle cx="10" cy="12.8" r="1.1" fill="#2d67e8" />
    </svg>
  );
}

function AuditOverviewSection() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.user));
  const showLoginPrompt = useLoginPromptStore((state) => state.show);

  const recentAudits = isAuthenticated ? [] : DEMO_RECENT_AUDITS;
  const inProgressAudit = isAuthenticated ? null : DEMO_IN_PROGRESS_AUDIT;

  const bodyClassName = (extra?: string) =>
    [
      'audit-overview-section__card-body',
      !isAuthenticated ? 'audit-overview-section__card-body--locked' : '',
      extra,
    ]
      .filter(Boolean)
      .join(' ');

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

          <div className={bodyClassName()}>
            {recentAudits.length === 0 ? (
              <p className="audit-overview-section__empty">
                최근 감사 이력이 없습니다.
              </p>
            ) : (
              <ul className="audit-overview-section__list">
                {recentAudits.map((audit) => {
                  const itemContent = (
                    <>
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
                    </>
                  );

                  return (
                    <li key={audit.name}>
                      {isAuthenticated ? (
                        <AuthGatedLink
                          to="/pre-diagnosis"
                          className="audit-overview-section__list-item"
                        >
                          {itemContent}
                        </AuthGatedLink>
                      ) : (
                        <span className="audit-overview-section__list-item">
                          {itemContent}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {!isAuthenticated && (
            <button
              type="button"
              className="audit-overview-section__lock"
              onClick={showLoginPrompt}
              aria-label={LOCKED_MESSAGE}
            >
              <LockIcon />
            </button>
          )}
        </div>

        <div className="audit-overview-section__card">
          <h3 className="audit-overview-section__card-title">진행중 감사</h3>

          <div className={bodyClassName()}>
            {inProgressAudit === null ? (
              <p className="audit-overview-section__empty">
                진행중인 감사가 없습니다.
              </p>
            ) : (
              <ProgressContent
                inProgressAudit={inProgressAudit}
                isAuthenticated={isAuthenticated}
              />
            )}
          </div>

          {!isAuthenticated && (
            <button
              type="button"
              className="audit-overview-section__lock"
              onClick={showLoginPrompt}
              aria-label={LOCKED_MESSAGE}
            >
              <LockIcon />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

interface ProgressContentProps {
  inProgressAudit: InProgressAudit;
  isAuthenticated: boolean;
}

function ProgressContent({
  inProgressAudit,
  isAuthenticated,
}: ProgressContentProps) {
  const inner = (
    <>
      <div className="audit-overview-section__progress-track">
        <div
          className="audit-overview-section__progress-bar"
          style={{
            width: `${(inProgressAudit.step / inProgressAudit.totalSteps) * 100}%`,
          }}
        />
      </div>

      <p className="audit-overview-section__progress-label">
        STEP {inProgressAudit.step} / {inProgressAudit.totalSteps} —{' '}
        {inProgressAudit.label}
      </p>
    </>
  );

  if (isAuthenticated) {
    return (
      <AuthGatedLink
        to="/pre-diagnosis"
        className="audit-overview-section__progress"
      >
        {inner}
      </AuthGatedLink>
    );
  }

  return <div className="audit-overview-section__progress">{inner}</div>;
}

export default AuditOverviewSection;
