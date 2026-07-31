import AuthGatedLink from '../../../../entities/user/ui/AuthGatedLink';
import { useAuthStore } from '../../../../entities/user/model/authStore';
import { useLoginPromptStore } from '../../../../entities/user/model/loginPromptStore';
import {
  TERMINAL_STATUSES,
  type AuditStatus,
  type AuditSummary,
} from '../../../../features/audit/api/auditApi';
import { selectRecentAudits } from '../../../../features/audit/model/selectRecentAudits';
import { useAuditsPolling } from '../../../../features/audit/model/useAuditsPolling';
import { getViewedAuditResultIds } from '../../../../features/audit/model/viewedAuditResults';

import './AuditOverviewSection.css';

type DisplayStatus = '준수' | '주의' | '미충족' | '분석 오류';

interface RecentAudit {
  auditId: number;
  name: string;
  version: string | null;
  date: string;
  status: DisplayStatus;
}

interface InProgressAudit {
  auditId: number;
  modelName: string;
  version: string | null;
  modelFileName: string | null;
  datasetFileName: string | null;
  createdAt: string;
  isAwaitingSelfCheck: boolean;
  label: string;
}

// 진행 단계별 이름 — SHAP/Fairlearn 같은 기술 용어 대신 사용자가 이해하기 쉬운 말로
// "Step{N} - {이름}" 형태로 버튼 자리에 그대로 보여준다.
const STEP_SHORT_LABEL: Record<number, string> = {
  1: '등록중',
  2: '지정중',
  3: '감사중',
  4: '감사중',
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
  { auditId: -1, name: 'A모델 감사', version: 'V2', date: '2026.07.06 14:32', status: '준수' },
  { auditId: -2, name: 'B모델 감사', version: 'V1', date: '2026.07.02 09:05', status: '주의' },
  { auditId: -3, name: 'C모델 감사', version: 'V1', date: '2026.06.28 18:47', status: '미충족' },
];

const DEMO_IN_PROGRESS_AUDITS: InProgressAudit[] = [
  {
    auditId: -1,
    modelName: 'C모델',
    version: 'V3',
    modelFileName: 'credit_model.json',
    datasetFileName: 'audit_dataset.csv',
    createdAt: '2026-07-24T09:00:00',
    isAwaitingSelfCheck: false,
    label: 'Step3 - 감사중',
  },
];

// 괄호 안 세부 판정만 색으로 구분한다 ("성공" 자체는 항상 검정).
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

// 최근 감사 이력은 같은 날 여러 건이 완료될 수 있어 시·분까지 보여준다.
function formatDateTime(value: string | null): string {
  if (!value) return '';

  const date = new Date(value);
  const datePart = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timePart = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${datePart} ${timePart}`;
}

const RECENT_AUDITS_LIMIT = 10;

// 같은 모델 계열은 최신 버전 하나만(버전 이력 개념을 합침), 실제로 최근에 완료된
// 감사만 보여준다 — "결과 확인"을 눌러봤는지는 더 이상 조건으로 보지 않는다.
function toRecentAudits(audits: AuditSummary[]): RecentAudit[] {
  return selectRecentAudits(audits, RECENT_AUDITS_LIMIT).map((audit) => ({
    auditId: audit.auditId,
    name: audit.modelName,
    version: audit.version,
    date: formatDateTime(audit.completedAt),
    status: STATUS_DISPLAY[audit.status] ?? '미충족',
  }));
}

// 아직 분석이 끝나지 않았거나(PENDING/IN_PROGRESS), 분석은 끝났지만 자가점검·결과 확인을
// 아직 안 한 감사를 전부 모아 최근 시작 순으로 보여준다 — 하나만이 아니라 진행중인 만큼 다 노출.
// 홈 화면에서 계속 추적해야 할 "내가 시작한 감사의 진행 상황"만 다루는 카드이지, 전체
// 감사 이력을 다시 보여주는 게 아니다(그건 왼쪽 "최근 감사 이력" 카드의 몫).
function toInProgressAudits(audits: AuditSummary[]): InProgressAudit[] {
  const viewedIds = getViewedAuditResultIds();

  return audits
    .filter(
      (audit) =>
        audit.status === 'PENDING' ||
        audit.status === 'IN_PROGRESS' ||
        (audit.status !== 'FAILED' &&
          TERMINAL_STATUSES.includes(audit.status) &&
          !viewedIds.has(audit.auditId)),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((audit) => {
      const isAwaitingSelfCheck = TERMINAL_STATUSES.includes(audit.status);

      return {
        auditId: audit.auditId,
        modelName: audit.modelName,
        version: audit.version,
        modelFileName: audit.modelFileName,
        datasetFileName: audit.datasetFileName,
        createdAt: audit.createdAt,
        isAwaitingSelfCheck,
        label: isAwaitingSelfCheck
          ? '결과 확인 대기 중'
          : `Step${audit.currentStep} - ${STEP_SHORT_LABEL[audit.currentStep] ?? '분석 진행중'}`,
      };
    });
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

  // 비로그인일 때는 아래 recentAudits/inProgressAudits 계산이 audits를 쓰지 않고
  // 데모 데이터로 대체하므로 조회할 필요가 없다.
  const audits = useAuditsPolling(isAuthenticated);

  const recentAudits = isAuthenticated
    ? toRecentAudits(audits ?? [])
    : DEMO_RECENT_AUDITS;
  const inProgressAudits = isAuthenticated
    ? toInProgressAudits(audits ?? [])
    : DEMO_IN_PROGRESS_AUDITS;

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
                        {audit.version && (
                          <span className="audit-overview-section__list-version"> {audit.version}</span>
                        )}
                      </span>
                      <span className="audit-overview-section__list-date">
                        {audit.date}
                      </span>
                      <span className="audit-overview-section__status">
                        {audit.status === '분석 오류' ? (
                          '실패'
                        ) : (
                          <>
                            성공{' '}
                            <span className={STATUS_CLASS_NAME[audit.status]}>
                              ({audit.status})
                            </span>
                          </>
                        )}
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
            {inProgressAudits.length === 0 ? (
              <p className="audit-overview-section__empty">
                진행중인 감사가 없습니다.
              </p>
            ) : (
              <ul className="audit-overview-section__progress-list">
                {inProgressAudits.map((audit) => (
                  <ProgressItem
                    key={audit.auditId}
                    audit={audit}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
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
      </div>
    </section>
  );
}

interface ProgressItemProps {
  audit: InProgressAudit;
  isAuthenticated: boolean;
}

// 진행중인 감사 하나를 카드 형태로 보여준다. 버튼 자리 자체가 상태 표시를 겸한다 —
// 아직 분석 중이면 "StepN 진행중"이 적힌 비활성 버튼, 결과가 나왔으면(자가점검·법령
// 매칭 대기 상태) 자가점검/법령 매칭 페이지로 갈 수 있는 활성 버튼이 된다. 분석만
// 끝났다고 결과 페이지로 바로 보내면 자가점검을 건너뛰게 되므로, 그 중간 단계인
// 체크리스트 페이지(/audit/{id})로 보낸다 — 거기서 건너뛰기했거나 제출을 마쳤으면
// 그 페이지 자체의 "결과 확인" 버튼으로 이어서 진행할 수 있다.
// 비로그인 데모 데이터는 실제 auditId가 아니므로 링크를 걸지 않는다.
function ProgressItem({ audit, isAuthenticated }: ProgressItemProps) {
  const resultButton = audit.isAwaitingSelfCheck ? (
    isAuthenticated ? (
      <AuthGatedLink
        to={`/audit/${audit.auditId}`}
        className="audit-overview-section__progress-result-button"
      >
        결과 확인
      </AuthGatedLink>
    ) : (
      <span className="audit-overview-section__progress-result-button">결과 확인</span>
    )
  ) : (
    <span
      className="audit-overview-section__progress-result-button audit-overview-section__progress-result-button--disabled"
      aria-disabled="true"
    >
      {audit.label}
    </span>
  );

  return (
    <li className="audit-overview-section__progress-item">
      <div className="audit-overview-section__progress-header">
        <span className="audit-overview-section__progress-name">
          {audit.modelName}
          {audit.version && (
            <span className="audit-overview-section__progress-version"> {audit.version}</span>
          )}
        </span>
        <span className="audit-overview-section__progress-date">
          {formatDate(audit.createdAt)}
        </span>
      </div>

      <div className="audit-overview-section__progress-footer">
        <div className="audit-overview-section__progress-meta-group">
          <p className="audit-overview-section__progress-meta">모델 파일 {audit.modelFileName ?? '—'}</p>
          <p className="audit-overview-section__progress-meta">데이터 {audit.datasetFileName ?? '—'}</p>
        </div>

        {resultButton}
      </div>
    </li>
  );
}

export default AuditOverviewSection;
