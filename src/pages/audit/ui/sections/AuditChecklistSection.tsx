import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Modal, Tooltip } from 'antd';

import {
  cancelAudit,
  getAudits,
  getRegulationMappings,
  getSelfCheckAnswers,
  retryAudit,
  saveSelfCheckAnswers,
  waitForRegulationMappings,
  RegulationMappingTimeoutError,
  TERMINAL_STATUSES,
  type AuditStatus,
  type RegulationMappingItem,
  type SelfCheckAnswerValue as ApiSelfCheckAnswerValue,
  type SelfCheckItemCode as ApiSelfCheckItemCode,
} from '../../../../features/audit/api/auditApi';
import { pregenerateSkippedChecklistReports } from '../../../../features/audit/api/reportApi';
import {
  isSkipSelfCheckDisabled,
  shouldPregenerateSkippedReports,
} from './checklistPregeneration';
import { extractApiErrorMessage } from '../../../../shared/api/client';
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  OBLIGATION_LABEL,
  SELF_CHECK_ITEMS,
  TOTAL_SELF_CHECK_ITEM_COUNT,
  type SelfCheckAnswer,
  type SelfCheckCategory,
} from '../../../../entities/self-check/model';
import StepIndicator from '../StepIndicator';

import './AuditFlow.css';

// 34조①2호는 이 화면(TR-02, 학습용데이터 개요 문서화 여부)과 설명가능성(SHAP) 리포트 양쪽에
// 걸쳐 있다 — 최종결과·주요 기준은 SHAP이 정량 판정하고, 학습용데이터 개요만 여기서 자가 응답한다
// (문서 6장⑥). 헷갈리지 않도록 이 항목에만 안내 배지를 붙인다.
const EXPLAINABILITY_OVERLAP_CODE = 'TR-02';

const EMPTY_SELF_CHECK_ANSWERS: Record<string, SelfCheckAnswer> = SELF_CHECK_ITEMS.reduce(
  (answers, item) => ({ ...answers, [item.code]: null }),
  {} as Record<string, SelfCheckAnswer>,
);

// 매칭 조항 우측 패널에서 항목을 문항 순서(TR→RM→UP→HO→DC→IA→SC, 각 그룹 내 문서 순서)로
// 정렬하기 위한 인덱스.
const ITEM_ORDER_INDEX: Record<string, number> = SELF_CHECK_ITEMS.reduce(
  (indexes, item, index) => ({ ...indexes, [item.code]: index }),
  {} as Record<string, number>,
);

interface AuditChecklistSectionProps {
  auditId: number;
}

function AuditChecklistSection({ auditId }: AuditChecklistSectionProps) {
  const navigate = useNavigate();

  const [isDone, setIsDone] = useState(false);
  const [status, setStatus] = useState<AuditStatus | null>(null);
  const [runningStep, setRunningStep] = useState(2);
  const [pollError, setPollError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const [selfCheckAnswers, setSelfCheckAnswers] =
    useState<Record<string, SelfCheckAnswer>>(EMPTY_SELF_CHECK_ANSWERS);
  const [openCategories, setOpenCategories] = useState<Set<SelfCheckCategory>>(
    () => new Set<SelfCheckCategory>(['TRANSPARENCY']),
  );
  const [isSelfCheckSubmitting, setIsSelfCheckSubmitting] = useState(false);
  const [isSelfCheckSubmitted, setIsSelfCheckSubmitted] = useState(false);
  const [selfCheckError, setSelfCheckError] = useState<string | null>(null);

  const [matchedArticles, setMatchedArticles] = useState<RegulationMappingItem[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isMappingPending, setIsMappingPending] = useState(false);

  // 자가점검을 하지 않고 넘어가고 싶은 사용자를 위한 건너뛰기 옵션 — 체크하면 자가점검
  // 제출 여부와 무관하게 결과 확인으로 넘어갈 수 있다.
  const [skipSelfCheck, setSkipSelfCheck] = useState(false);

  const isAnalyzed = isDone && status !== 'FAILED' && status !== 'CANCELLED';
  const isFailed = isDone && status === 'FAILED';
  const isCancelled = isDone && status === 'CANCELLED';

  // auditId가 바뀌면(다른 감사의 체크리스트 페이지로 바로 이동) 이전 감사의 진행/자가점검
  // 상태가 잠시 남아있지 않도록 렌더링 중에 바로 리셋한다.
  const [prevAuditId, setPrevAuditId] = useState(auditId);
  if (auditId !== prevAuditId) {
    setPrevAuditId(auditId);
    setIsDone(false);
    setStatus(null);
    setRunningStep(2);
    setPollError(null);
    setIsCancelling(false);
    setCancelError(null);
    setIsRetrying(false);
    setRetryError(null);
    setSelfCheckAnswers(EMPTY_SELF_CHECK_ANSWERS);
    setOpenCategories(new Set<SelfCheckCategory>(['TRANSPARENCY']));
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

  // 자가점검 21문항 응답 하이드레이션: 서버에 실제로 저장된 값을 그대로 반영한다.
  useEffect(() => {
    let cancelled = false;

    Promise.all([getSelfCheckAnswers(auditId), getRegulationMappings(auditId)])
      .then(([selfCheck, regulationMappings]) => {
        if (cancelled || auditIdRef.current !== auditId) return;

        if (selfCheck.answers.length > 0) {
          const hydrated = { ...EMPTY_SELF_CHECK_ANSWERS };
          selfCheck.answers.forEach((item) => {
            hydrated[item.itemCode] = item.answer;
          });
          setSelfCheckAnswers(hydrated);
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
  const unansweredCount = TOTAL_SELF_CHECK_ITEM_COUNT - answeredCount;

  const toggleCategory = (category: SelfCheckCategory) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const handleSelfCheckAnswer = (code: string, answer: SelfCheckAnswer) => {
    setIsSelfCheckSubmitted(false);

    // 이미 선택된 답변을 다시 누르면 선택을 해제한다(토글) — 해제하면 미응답으로 돌아간다.
    const nextAnswer = selfCheckAnswers[code] === answer ? null : answer;
    const nextAnswers = { ...selfCheckAnswers, [code]: nextAnswer };
    setSelfCheckAnswers(nextAnswers);
    // 답변을 바꾸면 이전 제출 기준으로 나온 매칭 조항은 더 이상 유효하지 않으므로 같이 지운다.
    setMatchedArticles([]);

    // 그룹의 모든 문항에 응답하면 그 그룹은 접고 다음 그룹을 자동으로 펼쳐서, 21문항을
    // 순서대로 이어서 응답하기 쉽게 한다.
    const item = SELF_CHECK_ITEMS.find((selfCheckItem) => selfCheckItem.code === code);
    if (!item) return;

    const groupItems = SELF_CHECK_ITEMS.filter(
      (selfCheckItem) => selfCheckItem.category === item.category,
    );
    const isGroupComplete = groupItems.every(
      (selfCheckItem) => nextAnswers[selfCheckItem.code] !== null,
    );

    if (isGroupComplete) {
      const nextCategory = CATEGORY_ORDER[CATEGORY_ORDER.indexOf(item.category) + 1];
      setOpenCategories((prev) => {
        const next = new Set(prev);
        next.delete(item.category);
        if (nextCategory) next.add(nextCategory);
        return next;
      });
    }
  };

  // 건너뛰기는 응답 자체를 지우지 않는다 — 잘못 눌렀다가 다시 해제했을 때 이미 고른 답변이
  // 그대로 남아있어야 하기 때문이다(체크된 동안은 버튼이 disabled라 편집만 막힌다).
  // 체크할 때만(해제할 때는 굳이 필요 없음) 판정서를 못 받는다는 걸 모달로 한 번 더
  // 확인시켜서, 실수로 체크하고 그대로 넘어가는 걸 막는다.
  const handleSkipSelfCheckChange = (checked: boolean) => {
    if (!checked) {
      setSkipSelfCheck(false);
      return;
    }

    Modal.confirm({
      icon: <ExclamationCircleFilled style={{ color: '#f2b21a' }} />,
      title: '자가점검을 건너뛰시겠어요?',
      content: '건너뛰면 이 감사에 대한 규제준수 판정서를 생성할 수 없습니다.',
      okText: '건너뛰기',
      cancelText: '취소',
      centered: true,
      okButtonProps: { danger: true },
      cancelButtonProps: { type: 'default' },
      onOk: () => setSkipSelfCheck(true),
    });
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
        setSelfCheckError(extractApiErrorMessage(error, '매칭 조항 조회 중 오류가 발생했습니다.'));
      }
    } finally {
      if (auditIdRef.current === id) setIsLoadingMatches(false);
    }
  };

  // 미응답 상태로도 제출을 막지 않는다(건너뛰기 기능이 이미 있어 제출 자체를 차단할 필요는
  // 없고, 미응답 개수는 경고 문구로만 안내한다) — 백엔드가 부분 제출을 허용하므로 지금까지
  // 응답한 항목만 그대로 보낸다.
  const handleSelfCheckSubmit = async () => {
    if (isSelfCheckSubmitting || answeredCount === 0) return;

    const submittedAuditId = auditId;

    setIsSelfCheckSubmitting(true);
    setSelfCheckError(null);

    try {
      const answers = Object.entries(selfCheckAnswers)
        .filter((entry): entry is [string, ApiSelfCheckAnswerValue] => entry[1] !== null)
        .map(([code, answer]) => ({
          itemCode: code as ApiSelfCheckItemCode,
          answer,
        }));

      await saveSelfCheckAnswers(submittedAuditId, answers);
      if (auditIdRef.current !== submittedAuditId) return;

      await loadMatchedArticles(submittedAuditId);

      if (auditIdRef.current === submittedAuditId) {
        setIsSelfCheckSubmitted(true);
      }
    } catch (error) {
      if (auditIdRef.current === submittedAuditId) {
        setSelfCheckError(extractApiErrorMessage(error, '규제 자가 점검 제출 중 오류가 발생했습니다.'));
      }
    } finally {
      if (auditIdRef.current === submittedAuditId) setIsSelfCheckSubmitting(false);
    }
  };

  // 자가점검을 제출한 경우의 3종(규제준수 판정서·개선 권고 가이드·최종 보고서)은 여기서
  // 걸지 않는다. 백엔드가 자가점검 매핑이 끝나는 시점에 같은 3종을 사전 생성하므로
  // (ReportPreGenerationService.preGenerateAfterSelfCheck) 여기서 또 걸면 두 번 만든다.
  //
  // 건너뛴 경우는 다르다. 자가점검 응답이 없어 백엔드 쪽 이벤트가 아예 발생하지 않으므로
  // 선생성이 하나도 안 걸린다. 그래서 "결과 확인"을 누르는 이 시점에(버튼이 활성화됐다는
  // 건 isAnalyzed가 true라는 뜻) 규제준수 판정서를 뺀 두 종만 프론트에서 건다.
  //
  // 제출과 건너뛰기가 동시에 참인 상태를 가려내는 판단은 shouldPregenerateSkippedReports
  // 에 두고 테스트로 고정한다.
  const handleProceedToResults = () => {
    if (shouldPregenerateSkippedReports({ skipSelfCheck, isSelfCheckSubmitted })) {
      void pregenerateSkippedChecklistReports(auditId);
    }
    navigate(`/audit/${auditId}/results`);
  };

  const handleRetryMatches = () => {
    if (isLoadingMatches) return;
    loadMatchedArticles(auditId);
  };

  // 취소 성공 시 다음 폴링 응답을 기다리지 않고 바로 상태를 CANCELLED로 반영해
  // 폴링 useEffect(의존값 isDone)가 즉시 정리되도록 한다. 다른 감사 화면으로 이미
  // 넘어간 뒤에 이전 요청의 응답이 늦게 와서 지금 화면 상태를 덮어쓰지 않도록
  // 요청 시작 시점의 auditId와 최신 auditId(ref)가 같을 때만 반영한다.
  const handleCancel = async () => {
    if (isCancelling) return;

    const submittedAuditId = auditId;

    setIsCancelling(true);
    setCancelError(null);

    try {
      await cancelAudit(submittedAuditId);
      if (auditIdRef.current !== submittedAuditId) return;

      setStatus('CANCELLED');
      setIsDone(true);
    } catch (error) {
      if (auditIdRef.current === submittedAuditId) {
        setCancelError(error instanceof Error ? error.message : '감사 취소 중 오류가 발생했습니다.');
      }
    } finally {
      if (auditIdRef.current === submittedAuditId) setIsCancelling(false);
    }
  };

  // 재시도 성공 시 isDone을 다시 false로 되돌려 폴링 useEffect(의존값 isDone)가
  // 처음부터 다시 돌게 한다. handleCancel과 동일하게 요청 시작 시점의 auditId와
  // 최신 auditId(ref)가 같을 때만 반영해 다른 감사 화면으로 넘어간 뒤 늦게 온
  // 응답이 지금 화면을 덮어쓰지 않게 한다.
  const handleRetry = async () => {
    if (isRetrying) return;

    const submittedAuditId = auditId;

    setIsRetrying(true);
    setRetryError(null);

    try {
      await retryAudit(submittedAuditId);
      if (auditIdRef.current !== submittedAuditId) return;

      setIsDone(false);
      setStatus(null);
      setRunningStep(2);
      setPollError(null);
    } catch (error) {
      if (auditIdRef.current === submittedAuditId) {
        setRetryError(error instanceof Error ? error.message : '감사 재시도 중 오류가 발생했습니다.');
      }
    } finally {
      if (auditIdRef.current === submittedAuditId) setIsRetrying(false);
    }
  };

  return (
    <div className="audit-execution-section">
      <StepIndicator doneSteps={[1, 2]} activeSteps={[3]} />

      {isFailed || isCancelled ? (
        <>
          <p className="audit-execution-section__empty" role="alert">
            {isFailed
              ? '감사 분석이 실패했습니다. 백엔드·AI 서버 로그를 확인해주세요.'
              : '감사를 취소했습니다.'}
          </p>
          <div className="audit-execution-section__retry-bar">
            <button
              type="button"
              className="audit-execution-section__retry-button"
              disabled={isRetrying}
              onClick={handleRetry}
            >
              {isRetrying ? '재시도하는 중…' : '재시도'}
            </button>
          </div>
        </>
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

              {/* SHAP·Fairlearn 분석은 백엔드에서 동시에 실행되어 어느 쪽이 먼저 끝날지
                  보장되지 않는다("SHAP 먼저 활성화 → Fairlearn 나중에 활성화"처럼 순서를
                  전제로 표시하면 실제 완료 순서와 어긋날 수 있음). 그래서 두 항목을 항상
                  함께 진행 중으로 보여주고, 완료 개수만 별도 문구로 안내한다. */}
              <ul className="audit-execution-section__progress-steps">
                <li className="audit-execution-section__progress-step audit-execution-section__progress-step--active">
                  <span className="audit-execution-section__progress-step-dot" aria-hidden="true" />
                  설명가능성(SHAP) 분석
                </li>
                <li className="audit-execution-section__progress-step audit-execution-section__progress-step--active">
                  <span className="audit-execution-section__progress-step-dot" aria-hidden="true" />
                  Fairlearn 공정성 분석
                </li>
              </ul>

              <p className="audit-execution-section__status-note">
                {runningStep >= 3 ? 1 : 0}/2개 분석 완료 · 두 분석을 동시에 진행합니다
              </p>

              <button
                type="button"
                className="audit-execution-section__cancel-button"
                disabled={isCancelling}
                onClick={handleCancel}
              >
                {isCancelling ? '취소하는 중…' : '감사 취소'}
              </button>
            </div>
          )}
        </div>
      )}

      {pollError && (
        <p className="audit-execution-section__empty" role="alert">
          {pollError}
        </p>
      )}

      {cancelError && (
        <p className="audit-execution-section__empty" role="alert">
          {cancelError}
        </p>
      )}

      {retryError && (
        <p className="audit-execution-section__empty" role="alert">
          {retryError}
        </p>
      )}

      <section className="audit-execution-section__result-card">
        <h2 className="audit-execution-section__result-title">자가점검 및 법령 매칭</h2>

        <div className="audit-execution-section__step4-grid">
          <div className="audit-execution-section__self-check">
            <div className="audit-execution-section__self-check-header">
              <h3 className="audit-execution-section__self-check-title">규제 자가점검 (21항목)</h3>
              <span className="audit-execution-section__self-check-count">
                {answeredCount}/{TOTAL_SELF_CHECK_ITEM_COUNT} 응답
              </span>
            </div>

            <div className="audit-execution-section__self-check-progress-track">
              <div
                className="audit-execution-section__self-check-progress-fill"
                style={{ width: `${(answeredCount / TOTAL_SELF_CHECK_ITEM_COUNT) * 100}%` }}
              />
            </div>

            <p className="audit-execution-section__self-check-desc">
              응답 내용은 감사 보고서에 &apos;담당자 확인&apos; 근거로 반영됩니다. 시스템이
              준수·미준수를 자동 판정하지 않으며, &apos;아니오&apos;로 답한 항목은 개선 권고와
              함께 정리됩니다.
            </p>

            <div className="audit-execution-section__self-check-groups">
              {CATEGORY_ORDER.map((category) => {
                const items = SELF_CHECK_ITEMS.filter((item) => item.category === category);
                const groupAnsweredCount = items.filter(
                  (item) => selfCheckAnswers[item.code] !== null,
                ).length;
                const meta = CATEGORY_META[category];
                const isOpen = openCategories.has(category);

                return (
                  <div key={category} className="audit-execution-section__self-check-group">
                    <button
                      type="button"
                      className="audit-execution-section__self-check-group-header"
                      aria-expanded={isOpen}
                      onClick={() => toggleCategory(category)}
                    >
                      <span
                        className="audit-execution-section__self-check-group-chevron"
                        aria-hidden="true"
                      >
                        {isOpen ? '▾' : '▸'}
                      </span>
                      <span className="audit-execution-section__self-check-group-title">
                        {meta.shortCode} · {meta.label}
                      </span>
                      <span className="audit-execution-section__self-check-group-hint">
                        {meta.articleHint}
                      </span>
                      <span className="audit-execution-section__self-check-group-count">
                        {groupAnsweredCount}/{items.length}
                      </span>
                    </button>

                    <div
                      className={`audit-execution-section__self-check-group-body${isOpen ? ' audit-execution-section__self-check-group-body--open' : ''}`}
                    >
                      <ul className="audit-execution-section__self-check-list">
                        {items.map((item) => {
                          const answer = selfCheckAnswers[item.code];

                          return (
                            <li key={item.code} className="audit-execution-section__self-check-item">
                              <div className="audit-execution-section__self-check-item-text">
                                <div className="audit-execution-section__self-check-item-head">
                                  <span className="audit-execution-section__self-check-item-code">
                                    {item.code}
                                  </span>
                                  <span
                                    className={`audit-execution-section__obligation-badge audit-execution-section__obligation-badge--${item.obligation.toLowerCase()}`}
                                  >
                                    {OBLIGATION_LABEL[item.obligation]}
                                  </span>
                                  {item.code === EXPLAINABILITY_OVERLAP_CODE && (
                                    <span className="audit-execution-section__explainability-badge">
                                      최종결과·주요 기준은 설명가능성 리포트에서 판정
                                    </span>
                                  )}
                                </div>
                                <p className="audit-execution-section__self-check-question">
                                  {item.question}
                                </p>
                                <p className="audit-execution-section__self-check-location">
                                  {item.evidenceHint}
                                </p>
                                {item.obligation === 'EFFORT' && answer === 'NO' && (
                                  <p className="audit-execution-section__effort-note">
                                    노력의무 항목이라 위반이 아닙니다. {item.recommendation}
                                  </p>
                                )}
                              </div>
                              <div className="audit-execution-section__answer-group">
                                <div className="audit-execution-section__answer-na-slot">
                                  {item.answerType === 'YES_NO_NA' ? (
                                    <button
                                      type="button"
                                      className={`audit-execution-section__answer audit-execution-section__answer--na${answer === 'NA' ? ' audit-execution-section__answer--selected-na' : ''}`}
                                      disabled={skipSelfCheck}
                                      onClick={() => handleSelfCheckAnswer(item.code, 'NA')}
                                    >
                                      해당없음
                                    </button>
                                  ) : (
                                    <span
                                      className="audit-execution-section__answer-na-placeholder"
                                      aria-hidden="true"
                                    />
                                  )}
                                </div>
                                <div className="audit-execution-section__answer-pair">
                                  <button
                                    type="button"
                                    className={`audit-execution-section__answer audit-execution-section__answer--yes${answer === 'YES' ? ' audit-execution-section__answer--selected-yes' : ''}`}
                                    disabled={skipSelfCheck}
                                    onClick={() => handleSelfCheckAnswer(item.code, 'YES')}
                                  >
                                    예
                                  </button>
                                  <button
                                    type="button"
                                    className={`audit-execution-section__answer audit-execution-section__answer--no${answer === 'NO' ? ' audit-execution-section__answer--selected-no' : ''}`}
                                    disabled={skipSelfCheck}
                                    onClick={() => handleSelfCheckAnswer(item.code, 'NO')}
                                  >
                                    아니오
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="audit-execution-section__self-check-footer">
              {isSelfCheckSubmitted ? (
                <span className="audit-execution-section__self-check-submitted">제출 완료</span>
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
                disabled={skipSelfCheck || isSelfCheckSubmitting || answeredCount === 0}
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
                    제목엔 그 줄에 해당하는 항 번호까지 정확히 표시하고, 배지엔 문항 코드를 표시한다.
                    문항 코드(문서 순서) 기준으로 정렬해 TR→SC 순으로 묶여 보이게 한다. */}
                {matchedArticles
                  .flatMap((article) =>
                    article.matchedItems.map((matched) => ({ article, matched })),
                  )
                  .sort((a, b) =>
                    (ITEM_ORDER_INDEX[a.matched.itemCode] ?? 0)
                    - (ITEM_ORDER_INDEX[b.matched.itemCode] ?? 0),
                  )
                  .map(({ article, matched }) => (
                    <li
                      key={`${article.mappingId}-${matched.itemCode}-${matched.clauseNo ?? ''}`}
                      className="audit-execution-section__matched-item"
                    >
                      <div className="audit-execution-section__matched-header">
                        <p className="audit-execution-section__matched-title">
                          {article.regulation} {article.article}
                          {matched.clauseNo ? ` ${matched.clauseNo}` : ''}
                          <Tooltip
                            title={article.content}
                            placement="top"
                            trigger={['hover', 'focus']}
                            styles={{ root: { maxWidth: 420 } }}
                          >
                            <button
                              type="button"
                              className="audit-execution-section__matched-help"
                              aria-label="조항 원문 보기"
                            >
                              ?
                            </button>
                          </Tooltip>
                        </p>
                        <span className="audit-execution-section__matched-badge">
                          {matched.itemCode}
                        </span>
                      </div>
                      <p className="audit-execution-section__matched-quote">{matched.note}</p>
                    </li>
                  ))}
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
            disabled={isSkipSelfCheckDisabled({ isSelfCheckSubmitted })}
            onChange={(event) => handleSkipSelfCheckChange(event.target.checked)}
          />
          자가점검을 건너뛰실 거면 체크해주세요
          <span className="audit-execution-section__checkbox-hint">
            (건너뛰면 규제준수 판정서를 생성할 수 없습니다)
          </span>
        </label>

        <button
          type="button"
          className="audit-execution-section__run-button"
          disabled={!isAnalyzed || (!skipSelfCheck && !isSelfCheckSubmitted)}
          onClick={handleProceedToResults}
        >
          결과 확인
        </button>
      </div>
    </div>
  );
}

export default AuditChecklistSection;