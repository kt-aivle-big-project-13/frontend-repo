import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getAudits,
  TERMINAL_STATUSES,
  type AuditStatus,
} from '../../../../features/audit/api/auditApi';
import StepIndicator from '../StepIndicator';

import './AuditFlow.css';

type SelfCheckAnswer = 'yes' | 'no' | null;

interface SelfCheckItem {
  id: string;
  question: string;
  location: string;
}

const SELF_CHECK_ITEMS: SelfCheckItem[] = [
  {
    id: 'notice',
    question: 'AI 심사 사실을 고객에게 사전에 알리고 있나요?',
    location: '확인 위치: 대출 신청 화면, 약관, 상품 설명서',
  },
  {
    id: 'objection',
    question: '고객이 심사 결과에 이의를 제기할 절차가 있나요?',
    location: '확인 위치: 이의제기 및 재심사 절차서, 고객센터 지침',
  },
  {
    id: 'oversight',
    question: 'AI 결정을 사람이 관리 및 감독하는 체계가 있나요?',
    location: '확인 위치: 승인권자 지정 문서, 심사 개입 프로세스',
  },
  {
    id: 'risk-management',
    question: '위험관리 규정이 수립 및 운영되고 있나요?',
    location: '확인 위치: 위험관리 내규, 운영 회의록',
  },
  {
    id: 'documentation',
    question: '조치 내용을 문서로 작성 및 보관하고 있나요?',
    location: '확인 위치: 위험관리 내규, 운영 회의록',
  },
];

const DEFAULT_SELF_CHECK: Record<string, SelfCheckAnswer> = {
  notice: null,
  objection: null,
  oversight: null,
  'risk-management': null,
  documentation: null,
};

interface MatchedArticle {
  id: string;
  title: string;
}

// TODO: 실제 RAG 법조문 매칭 API 연동 필요 — 원문 인용은 검색된 조항만 표시(임의 생성 금지)
const MATCHED_ARTICLES: MatchedArticle[] = [];

interface AuditChecklistSectionProps {
  auditId: number;
}

function AuditChecklistSection({ auditId }: AuditChecklistSectionProps) {
  const navigate = useNavigate();

  const [isDone, setIsDone] = useState(false);
  const [status, setStatus] = useState<AuditStatus | null>(null);
  const [runningStep, setRunningStep] = useState(2);
  const [pollError, setPollError] = useState<string | null>(null);

  const isAnalyzed = isDone && status !== 'FAILED';
  const isFailed = isDone && status === 'FAILED';

  // 모델 분석(SHAP → Fairlearn)은 백그라운드에서 진행되므로, 완료될 때까지 짧은 간격으로
  // 상태를 조회한다. 그 동안 사용자는 아래 자가점검 체크리스트를 먼저 작성할 수 있다.
  useEffect(() => {
    if (isDone) return;

    let cancelled = false;

    const poll = () => {
      getAudits()
        .then((audits) => {
          if (cancelled) return;
          const audit = audits.find((item) => item.auditId === auditId);
          if (!audit) return;

          setRunningStep(audit.currentStep);

          if (TERMINAL_STATUSES.includes(audit.status)) {
            setStatus(audit.status);
            setIsDone(true);
          }
        })
        .catch(() => {
          if (!cancelled) setPollError('감사 진행 상태를 불러오지 못했습니다.');
        });
    };

    poll();
    const timer = window.setInterval(poll, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [auditId, isDone]);

  const [selfCheckAnswers, setSelfCheckAnswers] =
    useState<Record<string, SelfCheckAnswer>>(DEFAULT_SELF_CHECK);
  const [isSelfCheckSubmitted, setIsSelfCheckSubmitted] = useState(false);

  const answeredCount = Object.values(selfCheckAnswers).filter(
    (answer) => answer !== null,
  ).length;
  const unansweredCount = SELF_CHECK_ITEMS.length - answeredCount;
  const isSelfCheckComplete = unansweredCount === 0;

  const handleSelfCheckAnswer = (id: string, answer: SelfCheckAnswer) => {
    setIsSelfCheckSubmitted(false);
    setSelfCheckAnswers((prev) => ({ ...prev, [id]: answer }));
  };

  return (
    <div className="audit-execution-section">
      <StepIndicator doneSteps={[1, 2]} activeSteps={[3]} />

      {isFailed ? (
        <p className="audit-execution-section__empty" role="alert">
          감사 분석이 실패했습니다. 백엔드·AI 서버 로그를 확인해주세요.
        </p>
      ) : (
        <div className="audit-execution-section__status-bar" role="status" aria-live="polite">
          <span className="audit-execution-section__status-icon" aria-hidden="true">
            {isAnalyzed ? (
              <span className="audit-execution-section__status-check">✓</span>
            ) : (
              <span className="audit-execution-section__spinner" />
            )}
          </span>

          <div className="audit-execution-section__status-body">
            <div className="audit-execution-section__status-text-group">
              <p className="audit-execution-section__status-text">
                {isAnalyzed ? '모델 분석 완료' : '모델 분석 진행 중'}
              </p>
              <p className="audit-execution-section__status-note">
                체크리스트를 작성하는 동안 분석이 함께 진행됩니다.
              </p>
            </div>

            {!isAnalyzed && (
              <ul className="audit-execution-section__progress-steps">
                <li
                  className={`audit-execution-section__progress-step${
                    runningStep > 3
                      ? ' audit-execution-section__progress-step--done'
                      : runningStep === 3
                        ? ' audit-execution-section__progress-step--active'
                        : ''
                  }`}
                >
                  <span className="audit-execution-section__progress-step-dot" aria-hidden="true">
                    {runningStep > 3 ? '✓' : ''}
                  </span>
                  설명가능성(SHAP) 분석
                </li>
                <li
                  className={`audit-execution-section__progress-step${
                    runningStep > 4
                      ? ' audit-execution-section__progress-step--done'
                      : runningStep === 4
                        ? ' audit-execution-section__progress-step--active'
                        : ''
                  }`}
                >
                  <span className="audit-execution-section__progress-step-dot" aria-hidden="true">
                    {runningStep > 4 ? '✓' : ''}
                  </span>
                  Fairlearn 공정성 분석
                </li>
              </ul>
            )}
          </div>
        </div>
      )}

      {pollError && (
        <p className="audit-execution-section__empty" role="alert">
          {pollError}
        </p>
      )}

      <section className="audit-execution-section__result-card">
        <h2 className="audit-execution-section__result-title">
          STEP 4 결과 — RAG 법조문 매칭
        </h2>

        <div className="audit-execution-section__step4-grid">
          <div className="audit-execution-section__self-check">
            <div className="audit-execution-section__self-check-header">
              <h3 className="audit-execution-section__self-check-title">
                STEP 4 — 규제 자가점검 (5항목)
              </h3>
              <span className="audit-execution-section__self-check-count">
                {answeredCount}/{SELF_CHECK_ITEMS.length} 응답
              </span>
            </div>

            <p className="audit-execution-section__self-check-desc">
              응답 내용은 감사 보고서에 &apos;담당자 확인&apos; 근거로 반영됩니다.
              &apos;아니오&apos;로 답한 항목은 개선 권고와 함께 정리됩니다.
            </p>

            <ul className="audit-execution-section__self-check-list">
              {SELF_CHECK_ITEMS.map((item) => (
                <li key={item.id} className="audit-execution-section__self-check-item">
                  <div className="audit-execution-section__self-check-item-text">
                    <p className="audit-execution-section__self-check-question">
                      {item.question}
                    </p>
                    <p className="audit-execution-section__self-check-location">
                      {item.location}
                    </p>
                  </div>
                  <div className="audit-execution-section__answer-group">
                    <button
                      type="button"
                      className={`audit-execution-section__answer audit-execution-section__answer--yes${selfCheckAnswers[item.id] === 'yes' ? ' audit-execution-section__answer--selected-yes' : ''}`}
                      onClick={() => handleSelfCheckAnswer(item.id, 'yes')}
                    >
                      예
                    </button>
                    <button
                      type="button"
                      className={`audit-execution-section__answer audit-execution-section__answer--no${selfCheckAnswers[item.id] === 'no' ? ' audit-execution-section__answer--selected-no' : ''}`}
                      onClick={() => handleSelfCheckAnswer(item.id, 'no')}
                    >
                      아니오
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="audit-execution-section__self-check-footer">
              {isSelfCheckSubmitted ? (
                <span className="audit-execution-section__self-check-submitted">
                  제출 완료
                </span>
              ) : (
                <span className="audit-execution-section__self-check-remaining">
                  {unansweredCount > 0
                    ? `${unansweredCount}개의 항목이 아직 미응답입니다.`
                    : '모든 항목에 응답했습니다.'}
                </span>
              )}
              <button
                type="button"
                className="audit-execution-section__submit-button"
                disabled={!isSelfCheckComplete || isSelfCheckSubmitted}
                onClick={() => setIsSelfCheckSubmitted(true)}
              >
                제출
              </button>
            </div>
          </div>

          <div className="audit-execution-section__matched-articles">
            <h3 className="audit-execution-section__self-check-title">
              STEP 4 — 매칭 조항 (실제 조항명·원문 인용)
            </h3>
            {MATCHED_ARTICLES.length === 0 ? (
              <p className="audit-execution-section__empty">
                RAG 법조문 매칭 API 연동 전이라 결과가 없습니다.
              </p>
            ) : (
              <ul className="audit-execution-section__matched-list">
                {MATCHED_ARTICLES.map((article) => (
                  <li key={article.id} className="audit-execution-section__matched-item">
                    <p className="audit-execution-section__matched-title">
                      {article.title}
                    </p>
                    <p className="audit-execution-section__matched-quote">
                      「...원문 인용 표시 영역...」
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <div className="audit-execution-section__proceed-bar">
        <button
          type="button"
          className="audit-execution-section__run-button"
          disabled={!isAnalyzed}
          onClick={() => navigate(`/audit/${auditId}/results`)}
        >
          결과 확인
        </button>
      </div>
    </div>
  );
}

export default AuditChecklistSection;