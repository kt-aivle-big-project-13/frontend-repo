import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'antd';

import {
  getAudits,
  getRegulationMappings,
  getSelfCheckAnswers,
  saveSelfCheckAnswers,
  waitForRegulationMappings,
  RegulationMappingTimeoutError,
  TERMINAL_STATUSES,
  type AuditStatus,
  type RegulationMappingItem,
  type SelfCheckItemCode,
} from '../../../../features/audit/api/auditApi';
import { markAuditResultsViewed } from '../../../../features/audit/model/viewedAuditResults';
import StepIndicator from '../StepIndicator';

import './AuditFlow.css';

type SelfCheckAnswer = 'yes' | 'no' | null;

interface SelfCheckItem {
  id: SelfCheckItemCode;
  question: string;
  location: string;
}

const SELF_CHECK_ITEMS: SelfCheckItem[] = [
  {
    id: 'NOTICE',
    question: 'AI 심사 사실을 고객에게 사전에 알리고 있나요?',
    location: '확인 위치: 대출 신청 화면, 약관, 상품 설명서',
  },
  {
    id: 'OBJECTION',
    question: '고객이 심사 결과에 이의를 제기할 절차가 있나요?',
    location: '확인 위치: 이의제기 및 재심사 절차서, 고객센터 지침',
  },
  {
    id: 'OVERSIGHT',
    question: 'AI 결정을 사람이 관리 및 감독하는 체계가 있나요?',
    location: '확인 위치: 승인권자 지정 문서, 심사 개입 프로세스',
  },
  {
    id: 'RISK_MANAGEMENT',
    question: '위험관리 규정이 수립 및 운영되고 있나요?',
    location: '확인 위치: 위험관리 내규, 운영 회의록',
  },
  {
    id: 'DOCUMENTATION',
    question: '조치 내용을 문서로 작성 및 보관하고 있나요?',
    location: '확인 위치: 위험관리 내규, 운영 회의록',
  },
];

// 매칭 조항 배지에 "1번" 식으로 표시할 문항 번호. 백엔드는 itemCode만 내려주므로
// SELF_CHECK_ITEMS 배열 순서를 그대로 번호로 쓴다.
const CHECKLIST_ITEM_NUMBERS: Record<SelfCheckItemCode, number> = SELF_CHECK_ITEMS.reduce(
  (numbers, item, index) => ({ ...numbers, [item.id]: index + 1 }),
  {} as Record<SelfCheckItemCode, number>,
);

const DEFAULT_SELF_CHECK: Record<SelfCheckItemCode, SelfCheckAnswer> = {
  NOTICE: null,
  OBJECTION: null,
  OVERSIGHT: null,
  RISK_MANAGEMENT: null,
  DOCUMENTATION: null,
};

interface AuditChecklistSectionProps {
  auditId: number;
}

function AuditChecklistSection({ auditId }: AuditChecklistSectionProps) {
  const navigate = useNavigate();

  const [isDone, setIsDone] = useState(false);
  const [status, setStatus] = useState<AuditStatus | null>(null);
  const [runningStep, setRunningStep] = useState(2);
  const [pollError, setPollError] = useState<string | null>(null);

  const [selfCheckAnswers, setSelfCheckAnswers] =
    useState<Record<SelfCheckItemCode, SelfCheckAnswer>>(DEFAULT_SELF_CHECK);
  const [isSelfCheckSubmitting, setIsSelfCheckSubmitting] = useState(false);
  const [isSelfCheckSubmitted, setIsSelfCheckSubmitted] = useState(false);
  const [selfCheckError, setSelfCheckError] = useState<string | null>(null);

  const [matchedArticles, setMatchedArticles] = useState<RegulationMappingItem[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isMappingPending, setIsMappingPending] = useState(false);

  // 자가점검을 하지 않고 넘어가고 싶은 사용자를 위한 건너뛰기 옵션 — 체크하면 자가점검
  // 제출 여부와 무관하게 결과 확인으로 넘어갈 수 있다.
  const [skipSelfCheck, setSkipSelfCheck] = useState(false);

  const isAnalyzed = isDone && status !== 'FAILED';
  const isFailed = isDone && status === 'FAILED';

  // auditId가 바뀌면(다른 감사의 체크리스트 페이지로 바로 이동) 이전 감사의 진행/자가점검
  // 상태가 잠시 남아있지 않도록 렌더링 중에 바로 리셋한다.
  const [prevAuditId, setPrevAuditId] = useState(auditId);
  if (auditId !== prevAuditId) {
    setPrevAuditId(auditId);
    setIsDone(false);
    setStatus(null);
    setRunningStep(2);
    setPollError(null);
    setSelfCheckAnswers(DEFAULT_SELF_CHECK);
    setIsSelfCheckSubmitted(false);
    setSelfCheckError(null);
    setMatchedArticles([]);
    setIsMappingPending(false);
    setSkipSelfCheck(false);
  }

  // 뒤늦게 도착한 이전 감사의 응답이 이미 전환된 화면을 덮어쓰지 않도록, 요청 시작 시점의
  // auditId와 최신 auditId(ref)가 같을 때만 상태를 갱신한다.
  const auditIdRef = useRef(auditId);
  useEffect(() => {
    auditIdRef.current = auditId;
  }, [auditId]);

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

  // 이 감사에 이미 저장된 자가점검 응답·매칭 조항이 있으면(알림/최근 이력에서 다시 들어온
  // 경우) 재작성하지 않도록 그대로 채워서 보여준다. 아직 없으면 조용히 빈 상태로 둔다.
  useEffect(() => {
    let cancelled = false;

    Promise.all([getSelfCheckAnswers(auditId), getRegulationMappings(auditId)])
      .then(([selfCheck, regulationMappings]) => {
        if (cancelled || auditIdRef.current !== auditId) return;

        if (selfCheck.answers.length > 0) {
          const hydratedAnswers = { ...DEFAULT_SELF_CHECK };
          selfCheck.answers.forEach((item) => {
            hydratedAnswers[item.itemCode] = item.answer ? 'yes' : 'no';
          });
          setSelfCheckAnswers(hydratedAnswers);
          setIsSelfCheckSubmitted(true);
        }

        setMatchedArticles(regulationMappings.mappings);
      })
      .catch(() => {
        // 아직 제출 전이라 저장된 응답이 없는 정상적인 경우일 수 있으므로 조용히 무시한다.
      });

    return () => {
      cancelled = true;
    };
  }, [auditId]);

  const answeredCount = Object.values(selfCheckAnswers).filter((answer) => answer !== null).length;
  const unansweredCount = SELF_CHECK_ITEMS.length - answeredCount;
  const isSelfCheckComplete = unansweredCount === 0;

  const handleSelfCheckAnswer = (id: SelfCheckItemCode, answer: SelfCheckAnswer) => {
    setIsSelfCheckSubmitted(false);
    // 이미 선택된 답변을 다시 누르면 선택을 해제한다(토글).
    setSelfCheckAnswers((prev) => ({ ...prev, [id]: prev[id] === answer ? null : answer }));
    // 답변을 바꾸면 이전 제출 기준으로 나온 매칭 조항은 더 이상 유효하지 않으므로 같이 지운다.
    setMatchedArticles([]);
  };

  // 자가점검 건너뛰기를 체크하면 더 이상 응답을 사용하지 않으므로, 이미 선택해둔 예/아니오
  // 버튼의 강조 표시도 함께 해제한다(체크 후에도 이전 선택이 눌린 채로 보이던 버그 수정).
  const handleSkipSelfCheckChange = (checked: boolean) => {
    setSkipSelfCheck(checked);
    if (checked) {
      setSelfCheckAnswers(DEFAULT_SELF_CHECK);
      setIsSelfCheckSubmitted(false);
      setMatchedArticles([]);
    }
  };

  // 매핑 생성이 제한 시간 내에 안 끝나면(RegulationMappingTimeoutError) 실제로 매핑이
  // 없는 것("매칭된 조항이 없습니다")과 구분해 아직 생성 중인 상태로 보여주고, 재조회할 수 있게 한다.
  const loadMatchedArticles = async (id: number) => {
    setIsLoadingMatches(true);
    setIsMappingPending(false);

    try {
      const mappings = await waitForRegulationMappings(id);
      if (auditIdRef.current !== id) return;
      setMatchedArticles(mappings);
    } catch (error) {
      if (auditIdRef.current !== id) return;

      if (error instanceof RegulationMappingTimeoutError) {
        setIsMappingPending(true);
      } else {
        setSelfCheckError(
          error instanceof Error ? error.message : '매칭 조항 조회 중 오류가 발생했습니다.',
        );
      }
    } finally {
      if (auditIdRef.current === id) setIsLoadingMatches(false);
    }
  };

  const handleSelfCheckSubmit = async () => {
    if (!isAnalyzed || !isSelfCheckComplete || isSelfCheckSubmitting) return;

    const submittedAuditId = auditId;

    setIsSelfCheckSubmitting(true);
    setSelfCheckError(null);

    try {
      const answers = SELF_CHECK_ITEMS.map((item) => ({
        itemCode: item.id,
        answer: selfCheckAnswers[item.id] === 'yes',
      }));

      await saveSelfCheckAnswers(submittedAuditId, answers);
      if (auditIdRef.current !== submittedAuditId) return;

      setIsSelfCheckSubmitted(true);
      await loadMatchedArticles(submittedAuditId);
    } catch (error) {
      if (auditIdRef.current === submittedAuditId) {
        setSelfCheckError(
          error instanceof Error ? error.message : '규제 자가 점검 제출 중 오류가 발생했습니다.',
        );
      }
    } finally {
      if (auditIdRef.current === submittedAuditId) setIsSelfCheckSubmitting(false);
    }
  };

  const handleRetryMatches = () => {
    if (isLoadingMatches) return;
    loadMatchedArticles(auditId);
  };

  return (
    <div className="audit-execution-section">
      <StepIndicator doneSteps={[1, 2]} activeSteps={[3]} />

      {isFailed ? (
        <p className="audit-execution-section__empty" role="alert">
          감사 분석이 실패했습니다. 백엔드·AI 서버 로그를 확인해주세요.
        </p>
      ) : (
        <div className="audit-execution-section__loading" role="status" aria-live="polite">
          {isAnalyzed ? (
            <span className="audit-execution-section__status-check" aria-hidden="true">
              ✓
            </span>
          ) : (
            <span className="audit-execution-section__spinner" aria-hidden="true" />
          )}

          <p className="audit-execution-section__loading-text">
            {isAnalyzed
              ? '모델 분석이 완료되었습니다.'
              : '모델 분석을 실행하고 있습니다. 잠시만 기다려주세요.'}
          </p>
          <p className="audit-execution-section__status-note">
            자가 점검하는 동안 분석이 함께 진행됩니다.
          </p>

          {!isAnalyzed && (
            <div className="audit-execution-section__progress">
              <div className="audit-execution-section__progress-track">
                <div className="audit-execution-section__progress-fill" />
              </div>

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
            </div>
          )}
        </div>
      )}

      {pollError && (
        <p className="audit-execution-section__empty" role="alert">
          {pollError}
        </p>
      )}

      <section className="audit-execution-section__result-card">
        <h2 className="audit-execution-section__result-title">자가점검 및 법령 매칭</h2>

        <div className="audit-execution-section__step4-grid">
          <div className="audit-execution-section__self-check">
            <div className="audit-execution-section__self-check-header">
              <h3 className="audit-execution-section__self-check-title">규제 자가점검 (5항목)</h3>
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
                    <p className="audit-execution-section__self-check-question">{item.question}</p>
                    <p className="audit-execution-section__self-check-location">{item.location}</p>
                  </div>
                  <div className="audit-execution-section__answer-group">
                    <button
                      type="button"
                      className={`audit-execution-section__answer audit-execution-section__answer--yes${selfCheckAnswers[item.id] === 'yes' ? ' audit-execution-section__answer--selected-yes' : ''}`}
                      disabled={skipSelfCheck}
                      onClick={() => handleSelfCheckAnswer(item.id, 'yes')}
                    >
                      예
                    </button>
                    <button
                      type="button"
                      className={`audit-execution-section__answer audit-execution-section__answer--no${selfCheckAnswers[item.id] === 'no' ? ' audit-execution-section__answer--selected-no' : ''}`}
                      disabled={skipSelfCheck}
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
                <span className="audit-execution-section__self-check-submitted">제출 완료</span>
              ) : !isAnalyzed ? (
                <span className="audit-execution-section__self-check-remaining">
                  분석 완료 후 제출 가능합니다.
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
                disabled={
                  skipSelfCheck ||
                  !isAnalyzed ||
                  !isSelfCheckComplete ||
                  isSelfCheckSubmitted ||
                  isSelfCheckSubmitting
                }
                onClick={handleSelfCheckSubmit}
              >
                {isSelfCheckSubmitting ? '제출 중…' : '제출'}
              </button>
            </div>

            {selfCheckError && (
              <p className="audit-execution-section__empty" role="alert">
                {selfCheckError}
              </p>
            )}
          </div>

          <div className="audit-execution-section__matched-articles">
            <h3 className="audit-execution-section__self-check-title">
              매칭 조항 (실제 조항명·원문 인용)
            </h3>
            {isLoadingMatches ? (
              <p className="audit-execution-section__empty">매칭 조항을 불러오는 중입니다…</p>
            ) : isMappingPending ? (
              <div className="audit-execution-section__empty">
                <p>매칭 조항을 아직 생성하는 중입니다. 잠시 후 다시 조회해주세요.</p>
                <button
                  type="button"
                  className="audit-execution-section__submit-button"
                  onClick={handleRetryMatches}
                >
                  다시 조회
                </button>
              </div>
            ) : matchedArticles.length === 0 ? (
              <p className="audit-execution-section__empty">
                {isSelfCheckSubmitted
                  ? '매칭된 조항이 없습니다.'
                  : '자가점검을 제출하면 매칭 결과가 표시됩니다.'}
              </p>
            ) : (
              <ul className="audit-execution-section__matched-list">
                {/* 조항 하나가 여러 문항에, 문항마다 다른 항으로 걸릴 수 있어(예: 제34조는
                    위험관리 문항엔 ①1호, 관리감독 문항엔 ①4호) 문항당 한 줄로 펼쳐서 보여준다.
                    제목엔 그 줄에 해당하는 항 번호까지 정확히 표시하고, 배지엔 문항 번호만 표시한다. */}
                {matchedArticles.flatMap((article) =>
                  article.matchedItems.map((matched) => (
                    <li
                      key={`${article.mappingId}-${matched.itemCode}`}
                      className="audit-execution-section__matched-item"
                    >
                      <div className="audit-execution-section__matched-header">
                        <p className="audit-execution-section__matched-title">
                          {article.regulation} {article.article}
                          {matched.clauseNo ? ` ${matched.clauseNo}` : ''}
                        </p>
                        <span className="audit-execution-section__matched-badge">
                          {CHECKLIST_ITEM_NUMBERS[matched.itemCode]}번
                        </span>
                      </div>
                      <Tooltip title={article.content} placement="top">
                        <p className="audit-execution-section__matched-quote">{matched.note}</p>
                      </Tooltip>
                    </li>
                  )),
                )}
              </ul>
            )}
          </div>
        </div>
      </section>

      <div className="audit-execution-section__proceed-bar">
        <label className="audit-execution-section__checkbox-label">
          <input
            type="checkbox"
            checked={skipSelfCheck}
            onChange={(event) => handleSkipSelfCheckChange(event.target.checked)}
          />
          자가점검을 건너뛰실 거면 체크해주세요
        </label>

        <button
          type="button"
          className="audit-execution-section__run-button"
          disabled={!isAnalyzed || (!skipSelfCheck && !isSelfCheckSubmitted)}
          onClick={() => {
            // 홈 화면 "최근 감사 이력"은 결과를 실제로 확인한 감사만 보여준다.
            markAuditResultsViewed(auditId);
            navigate(`/audit/${auditId}/results`);
          }}
        >
          결과 확인
        </button>
      </div>
    </div>
  );
}

export default AuditChecklistSection;
