import AuthGatedLink from '../../../../entities/user/ui/AuthGatedLink';
import { useAuthStore } from '../../../../entities/user/model/authStore';
import { useLoginPromptStore } from '../../../../entities/user/model/loginPromptStore';
import {
  TERMINAL_STATUSES,
  type AuditStatus,
  type AuditSummary,
} from '../../../../features/audit/api/auditApi';
import { useAuditsPolling } from '../../../../features/audit/model/useAuditsPolling';
import { getViewedAuditResultIds } from '../../../../features/audit/model/viewedAuditResults';

import './AuditOverviewSection.css';

type DisplayStatus = '준수' | '주의' | '미충족' | '분석 오류';

interface RecentAudit {
  auditId: number;
  name: string;
  date: string;
  status: DisplayStatus;
}

interface InProgressAudit {
  auditId: number;
  step: number;
  totalSteps: number;
  label: string;
}

const TOTAL_STEPS = 4;

const STEP_LABEL: Record<number, string> = {
  1: '모델·데이터셋 등록',
  2: '민감정보 지정',
  3: '설명가능성(SHAP) 분석 중',
  4: '공정성(Fairlearn) 분석 중',
};

const STATUS_DISPLAY: Record<AuditStatus, DisplayStatus | null> = {
  PENDING: null,
  IN_PROGRESS: null,
  COMPLIANT: '준수',
  WARNING: '주의',
  NON_COMPLIANT: '미충족',
  UNCONFIRMED: '미충족',
  // AI 서버 연동 실패 등 분석 자체가 안 된 상태 - 규정 미충족(NON_COMPLIANT)과
  // 다른 라벨/색으로 구분해서 실제 판정처럼 오해하지 않도록 한다.
  FAILED: '분석 오류',
};

// 비로그인 시 데모 미리보기용 더미 데이터.
const DEMO_RECENT_AUDITS: RecentAudit[] = [
  { auditId: -1, name: 'A모델 v2 감사', date: '2026.07.06', status: '준수' },
  { auditId: -2, name: 'B모델 v1 감사', date: '2026.07.02', status: '주의' },
  { auditId: -3, name: 'A모델 v1 감사', date: '2026.06.28', status: '미충족' },
];

const DEMO_IN_PROGRESS_AUDIT: InProgressAudit = {
  auditId: -1,
  step: 3,
  totalSteps: TOTAL_STEPS,
  label: 'RAG 법조문 매칭 중',
};

const STATUS_CLASS_NAME: Record<DisplayStatus, string> = {
  준수: 'audit-overview-section__status--pass',
  주의: 'audit-overview-section__status--warn',
  미충족: 'audit-overview-section__status--fail',
  '분석 오류': 'audit-overview-section__status--error',
};

const LOCKED_MESSAGE = '로그인 후 이용 가능합니다';

function formatDate(value: string | null): string {
  if (!value) return '';

  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

const RECENT_AUDITS_LIMIT = 10;

function toRecentAudits(audits: AuditSummary[]): RecentAudit[] {
  // "결과 확인" 버튼을 한 번도 눌러보지 않은 감사는 아직 사용자가 결과를 확인하지
  // 않은 것이므로 최근 이력에 노출하지 않는다.
  const viewedIds = getViewedAuditResultIds();

  return audits
    .filter(
      (audit) => TERMINAL_STATUSES.includes(audit.status) && viewedIds.has(audit.auditId),
    )
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, RECENT_AUDITS_LIMIT)
    .map((audit) => ({
      auditId: audit.auditId,
      name: audit.modelName,
      date: formatDate(audit.completedAt),
      status: STATUS_DISPLAY[audit.status] ?? '미충족',
    }));
}

function toInProgressAudit(audits: AuditSummary[]): InProgressAudit | null {
  const inProgress = audits.find(
    (audit) => audit.status === 'PENDING' || audit.status === 'IN_PROGRESS',
  );

  if (!inProgress) return null;

  return {
    auditId: inProgress.auditId,
    step: inProgress.currentStep,
    totalSteps: TOTAL_STEPS,
    label: STEP_LABEL[inProgress.currentStep] ?? '분석 진행 중',
  };
}

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

  // 비로그인일 때는 아래 recentAudits/inProgressAudit 계산이 audits를 쓰지 않고
  // 데모 데이터로 대체하므로 조회할 필요가 없다.
  const audits = useAuditsPolling(isAuthenticated);

  const recentAudits = isAuthenticated
    ? toRecentAudits(audits ?? [])
    : DEMO_RECENT_AUDITS;
  const inProgressAudit = isAuthenticated
    ? toInProgressAudit(audits ?? [])
    : DEMO_IN_PROGRESS_AUDIT;

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
                    <li key={audit.auditId}>
                      {isAuthenticated ? (
                        <AuthGatedLink
                          to={`/audit/${audit.auditId}/results`}
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

// 진행중인 감사를 클릭하면 감사 진행 중 페이지(체크리스트/분석 진행 화면)로 이동한다.
// 비로그인 데모 데이터는 실제 auditId가 아니므로 클릭 가능하게 만들지 않는다.
function ProgressContent({ inProgressAudit, isAuthenticated }: ProgressContentProps) {
  const body = (
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

  if (!isAuthenticated) {
    return <div className="audit-overview-section__progress">{body}</div>;
  }

  return (
    <AuthGatedLink
      to={`/audit/${inProgressAudit.auditId}`}
      className="audit-overview-section__progress"
    >
      {body}
    </AuthGatedLink>
  );
}

export default AuditOverviewSection;