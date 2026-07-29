import { useCallback, useEffect, useState } from 'react';

import AuthGatedLink from '../../../../entities/user/ui/AuthGatedLink';
import { useAuthStore } from '../../../../entities/user/model/authStore';
import { useLoginPromptStore } from '../../../../entities/user/model/loginPromptStore';
import {
  getAudits,
  TERMINAL_STATUSES,
  type AuditStatus,
  type AuditSummary,
} from '../../../../features/audit/api/auditApi';

import './AuditOverviewSection.css';

type DisplayStatus = '준수' | '주의' | '미충족' | '분석 오류';

interface RecentAudit {
  auditId: number;
  name: string;
  date: string;
  status: DisplayStatus;
}

interface InProgressAudit {
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
const AUDIT_POLL_INTERVAL_MS = 5000;

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
  return audits
    .filter((audit) => TERMINAL_STATUSES.includes(audit.status) && audit.status !== 'FAILED')
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

  const [audits, setAudits] = useState<AuditSummary[] | null>(null);

  const refreshAudits = useCallback(() => {
    getAudits()
      .then(setAudits)
      .catch(() => setAudits([]));
  }, []);

  useEffect(() => {
    // 비로그인일 때는 아래 recentAudits/inProgressAudit 계산이 audits state를
    // 쓰지 않고 데모 데이터로 대체하므로 조회할 필요가 없다.
    if (!isAuthenticated) return;

    refreshAudits();

    // 감사 분석은 짧으면 몇 초 안에 끝나서, 한 번만 조회하면 진행중 상태를
    // 거의 못 보고 완료 상태로 넘어가버린다. 이 화면에 머무는 동안은 주기적으로
    // 다시 조회해 진행중 -> 완료 전환이 반영되도록 한다.
    const timer = window.setInterval(refreshAudits, AUDIT_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, refreshAudits]);

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
                          to={`/audit/${audit.auditId}`}
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
              <ProgressContent inProgressAudit={inProgressAudit} />
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
}

// 진행중인 감사를 이어보는 기능이 아직 없어(감사 실행 화면이 ID 기반 재개를
// 지원하지 않음), 상태만 보여주고 클릭은 만들지 않는다.
function ProgressContent({ inProgressAudit }: ProgressContentProps) {
  return (
    <div className="audit-overview-section__progress">
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
    </div>
  );
}

export default AuditOverviewSection;