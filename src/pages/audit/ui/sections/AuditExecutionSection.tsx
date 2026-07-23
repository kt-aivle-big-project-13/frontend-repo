import { useMemo, useRef, useState, type DragEvent } from 'react';

import StepIndicator from '../StepIndicator';

import './AuditExecutionSection.css';

type ModelMode = 'new' | 'update';
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

const MATCHED_ARTICLES: MatchedArticle[] = [
  { id: 'art-31-1', title: '제31조① AI 사용 사실 사전 고지' },
  { id: 'art-33-1', title: '제33조① 고영향 AI 해당 여부 사전 검토' },
  { id: 'art-34-1-1', title: '제34조①1호 위험 관리 방안' },
  { id: 'art-34-1-2', title: '제34조①2호 설명가능성' },
  { id: 'art-34-1-3', title: '제34조①3호 이용자 보호' },
  { id: 'art-34-1-4', title: '제34조①4호 사람의 관리 및 감독' },
  { id: 'art-34-1-5', title: '제34조①5호 문서 작성 및 보관' },
];

interface Deliverable {
  id: string;
  label: string;
  fileType: 'PDF' | 'Word';
}

const DELIVERABLES: Deliverable[] = [
  { id: 'shap-report', label: '설명가능성 리포트 (SHAP)', fileType: 'PDF' },
  { id: 'fairness-report', label: '편향 진단 보고서 (Fairlearn)', fileType: 'PDF' },
  { id: 'compliance-verdict', label: '규제준수 판정서', fileType: 'PDF' },
  { id: 'impact-assessment', label: '영향평가서 초안', fileType: 'PDF' },
  { id: 'improvement-guide', label: '개선 권고 가이드', fileType: 'Word' },
];

const DEFAULT_SELECTED_DELIVERABLES = new Set([
  'shap-report',
  'fairness-report',
  'compliance-verdict',
  'impact-assessment',
]);

// TODO: 실제 SHAP/Fairlearn 분석 API 연동 전까지는 목업 결과값
const EXPLAINABILITY_RESULT = {
  sensitiveFeatureShare: 14.2,
  explanationConsistency: 0.63,
  explanationFidelity: 0.55,
};

const FAIRNESS_RESULT = {
  demographicParity: 0.08,
  equalOpportunity: 0.12,
  equalizedOdds: 0.07,
};

function evaluateSensitiveFeatureShare(value: number) {
  if (value <= 20) return { label: '충족 (≤20%)', variant: 'good' as const };
  if (value <= 22) return { label: '주의 (20~22%)', variant: 'warn' as const };
  return { label: '초과 (>22%)', variant: 'bad' as const };
}

function evaluateConsistency(value: number) {
  if (value >= 0.7) return { label: '충족 (≥0.7)', variant: 'good' as const };
  if (value >= 0.5) return { label: '주의 (0.5~0.7)', variant: 'warn' as const };
  return { label: '미충족 (<0.5)', variant: 'bad' as const };
}

function evaluateFidelity(value: number) {
  if (value >= 0.5) return { label: '충족 (≥0.5)', variant: 'good' as const };
  if (value >= 0.4) return { label: '주의 (0.4~0.5)', variant: 'warn' as const };
  return { label: '미충족 (<0.4)', variant: 'bad' as const };
}

function evaluateFairnessMetric(value: number) {
  return Math.abs(value) <= 0.1
    ? { label: '정상', variant: 'good' as const }
    : { label: '추가검토', variant: 'bad' as const };
}

function AuditExecutionSection() {
  const [modelMode, setModelMode] = useState<ModelMode>('new');
  const [modelName, setModelName] = useState('');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [validationFile, setValidationFile] = useState<File | null>(null);
  const [sensitiveColumns, setSensitiveColumns] = useState<Set<string>>(
    () => new Set(),
  );
  const [manualColumnInput, setManualColumnInput] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const [selfCheckAnswers, setSelfCheckAnswers] =
    useState<Record<string, SelfCheckAnswer>>(DEFAULT_SELF_CHECK);
  const [isSelfCheckSubmitted, setIsSelfCheckSubmitted] = useState(false);

  const [selectedDeliverables, setSelectedDeliverables] = useState<Set<string>>(
    () => new Set(DEFAULT_SELECTED_DELIVERABLES),
  );

  const modelFileInputRef = useRef<HTMLInputElement>(null);
  const validationFileInputRef = useRef<HTMLInputElement>(null);

  const answeredCount = useMemo(
    () => Object.values(selfCheckAnswers).filter((answer) => answer !== null).length,
    [selfCheckAnswers],
  );
  const unansweredCount = SELF_CHECK_ITEMS.length - answeredCount;
  const isSelfCheckComplete = unansweredCount === 0;

  const selectedDeliverableCount = selectedDeliverables.size;

  const isModelFileSupported = useMemo(() => {
    if (!modelFile) return null;
    return /\.(pkl|joblib|json)$/i.test(modelFile.name);
  }, [modelFile]);

  const handleModelDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) setModelFile(file);
  };

  const handleValidationFile = (file: File | null) => {
    setValidationFile(file);
  };

  const handleValidationDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) handleValidationFile(file);
  };

  const toggleSensitiveColumn = (column: string) => {
    setSensitiveColumns((prev) => {
      const next = new Set(prev);
      if (next.has(column)) {
        next.delete(column);
      } else {
        next.add(column);
      }
      return next;
    });
  };

  const handleAddManualColumn = () => {
    const column = manualColumnInput.trim();
    if (!column) return;

    setSensitiveColumns((prev) => new Set(prev).add(column));
    setManualColumnInput('');
  };

  const handleRunAnalysis = () => {
    if (!modelFile || !validationFile || isAnalyzing) return;

    setIsAnalyzing(true);
    window.setTimeout(() => {
      setIsAnalyzing(false);
      setIsAnalyzed(true);
    }, 900);
  };

  const handleSelfCheckAnswer = (id: string, answer: SelfCheckAnswer) => {
    setIsSelfCheckSubmitted(false);
    setSelfCheckAnswers((prev) => ({ ...prev, [id]: answer }));
  };

  const toggleDeliverable = (id: string) => {
    setSelectedDeliverables((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const sensitiveShareResult = evaluateSensitiveFeatureShare(
    EXPLAINABILITY_RESULT.sensitiveFeatureShare,
  );
  const consistencyResult = evaluateConsistency(
    EXPLAINABILITY_RESULT.explanationConsistency,
  );
  const fidelityResult = evaluateFidelity(EXPLAINABILITY_RESULT.explanationFidelity);

  const demographicParityResult = evaluateFairnessMetric(
    FAIRNESS_RESULT.demographicParity,
  );
  const equalOpportunityResult = evaluateFairnessMetric(
    FAIRNESS_RESULT.equalOpportunity,
  );
  const equalizedOddsResult = evaluateFairnessMetric(FAIRNESS_RESULT.equalizedOdds);

  return (
    <div className="audit-execution-section">
      <StepIndicator
        doneSteps={isAnalyzed ? [1, 2, 3, 4] : [1]}
        activeSteps={isAnalyzed ? [5] : [2, 3, 4]}
      />

      <div className="audit-execution-section__upload-grid">
        <div className="audit-execution-section__upload-card">
          <div className="audit-execution-section__upload-header">
            <h2 className="audit-execution-section__upload-title">① 모델 업로드</h2>

            <div className="audit-execution-section__mode-toggle">
              <button
                type="button"
                className={`audit-execution-section__mode-button${modelMode === 'new' ? ' audit-execution-section__mode-button--active' : ''}`}
                onClick={() => setModelMode('new')}
              >
                신규
              </button>
              <button
                type="button"
                className={`audit-execution-section__mode-button${modelMode === 'update' ? ' audit-execution-section__mode-button--active' : ''}`}
                onClick={() => setModelMode('update')}
              >
                기존(버전업)
              </button>
            </div>
          </div>

          <label className="audit-execution-section__field-label" htmlFor="model-name">
            모델명
          </label>
          <input
            id="model-name"
            type="text"
            className="audit-execution-section__text-input"
            value={modelName}
            onChange={(event) => setModelName(event.target.value)}
            placeholder="모델명을 입력해주세요"
          />

          <div
            className="audit-execution-section__dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleModelDrop}
          >
            <span className="audit-execution-section__dropzone-text">
              {modelFile ? modelFile.name : '.pkl / .joblib / .json 드래그앤드롭'}
            </span>
            <button
              type="button"
              className="audit-execution-section__upload-trigger"
              onClick={() => modelFileInputRef.current?.click()}
            >
              업로드
            </button>
            <input
              ref={modelFileInputRef}
              type="file"
              accept=".pkl,.joblib,.json"
              className="audit-execution-section__hidden-input"
              onChange={(event) => setModelFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <p
            className={`audit-execution-section__hint${isModelFileSupported === null ? '' : isModelFileSupported ? ' audit-execution-section__hint--valid' : ' audit-execution-section__hint--invalid'}`}
          >
            지원 형식: XGBoost(.json, v1.0+) / .pkl / .joblib
          </p>
        </div>

        <div className="audit-execution-section__upload-card">
          <h2 className="audit-execution-section__upload-title">
            ② 검증 데이터 + 민감변수 지정
          </h2>

          <div
            className="audit-execution-section__dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleValidationDrop}
          >
            <span className="audit-execution-section__dropzone-text">
              {validationFile ? validationFile.name : 'validation_data.csv 드래그앤드롭'}
            </span>
            <button
              type="button"
              className="audit-execution-section__upload-trigger"
              onClick={() => validationFileInputRef.current?.click()}
            >
              업로드
            </button>
            <input
              ref={validationFileInputRef}
              type="file"
              accept=".csv"
              className="audit-execution-section__hidden-input"
              onChange={(event) =>
                handleValidationFile(event.target.files?.[0] ?? null)
              }
            />
          </div>

          <p className="audit-execution-section__field-label">
            민감변수 컬럼
            <span className="audit-execution-section__field-label-count">
              {sensitiveColumns.size}개
            </span>
          </p>

          <div className="audit-execution-section__sensitive-input-row">
            <input
              type="text"
              className="audit-execution-section__text-input"
              value={manualColumnInput}
              onChange={(event) => setManualColumnInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleAddManualColumn();
                }
              }}
              placeholder="컬럼명을 입력해주세요"
            />
            <button
              type="button"
              className="audit-execution-section__tag-add-button"
              onClick={handleAddManualColumn}
            >
              추가
            </button>
          </div>

          {sensitiveColumns.size > 0 && (
            <div className="audit-execution-section__tag-list">
              {[...sensitiveColumns].map((column) => (
                <span key={column} className="audit-execution-section__tag audit-execution-section__tag--selected">
                  {column}
                  <button
                    type="button"
                    className="audit-execution-section__tag-remove"
                    onClick={() => toggleSensitiveColumn(column)}
                    aria-label={`${column} 제거`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="audit-execution-section__run-bar">
        <button
          type="button"
          className="audit-execution-section__run-button"
          disabled={!modelFile || !validationFile || isAnalyzing}
          onClick={handleRunAnalysis}
        >
          {isAnalyzing ? '분석 중…' : '감사 분석 실행'}
        </button>
      </div>

      {!isAnalyzed ? (
        <p className="audit-execution-section__empty">
          모델과 검증 데이터를 업로드하고 분석을 실행하면 결과가 표시됩니다.
        </p>
      ) : (
        <>
          <section className="audit-execution-section__result-card">
            <h2 className="audit-execution-section__result-title">
              STEP 2 결과 — 설명가능성 3지표
            </h2>
            <div className="audit-execution-section__stat-grid">
              <div className="audit-execution-section__stat">
                <p className="audit-execution-section__stat-label">민감변수 기여비율</p>
                <p className="audit-execution-section__stat-value">
                  {EXPLAINABILITY_RESULT.sensitiveFeatureShare}%
                </p>
                <span
                  className={`audit-execution-section__badge audit-execution-section__badge--${sensitiveShareResult.variant}`}
                >
                  {sensitiveShareResult.label}
                </span>
              </div>
              <div className="audit-execution-section__stat">
                <p className="audit-execution-section__stat-label">설명 일관성</p>
                <p className="audit-execution-section__stat-value">
                  {EXPLAINABILITY_RESULT.explanationConsistency}
                </p>
                <span
                  className={`audit-execution-section__badge audit-execution-section__badge--${consistencyResult.variant}`}
                >
                  {consistencyResult.label}
                </span>
              </div>
              <div className="audit-execution-section__stat">
                <p className="audit-execution-section__stat-label">설명 충실성</p>
                <p className="audit-execution-section__stat-value">
                  {EXPLAINABILITY_RESULT.explanationFidelity}
                </p>
                <span
                  className={`audit-execution-section__badge audit-execution-section__badge--${fidelityResult.variant}`}
                >
                  {fidelityResult.label}
                </span>
              </div>
            </div>
          </section>

          <section className="audit-execution-section__result-card">
            <h2 className="audit-execution-section__result-title">
              STEP 3 결과 — Fairlearn 공정성{' '}
              <span className="audit-execution-section__result-note">
                (편향은 확정이 아닌 추가검토 신호)
              </span>
            </h2>
            <div className="audit-execution-section__stat-grid">
              <div className="audit-execution-section__stat">
                <p className="audit-execution-section__stat-label">Demographic Parity</p>
                <div className="audit-execution-section__fairness-row">
                  <p className="audit-execution-section__stat-value">
                    {FAIRNESS_RESULT.demographicParity}
                  </p>
                  <span
                    className={`audit-execution-section__fairness-status audit-execution-section__fairness-status--${demographicParityResult.variant}`}
                  >
                    {demographicParityResult.label}
                  </span>
                </div>
              </div>
              <div className="audit-execution-section__stat">
                <p className="audit-execution-section__stat-label">Equal Opportunity</p>
                <div className="audit-execution-section__fairness-row">
                  <p className="audit-execution-section__stat-value">
                    {FAIRNESS_RESULT.equalOpportunity}
                  </p>
                  <span
                    className={`audit-execution-section__fairness-status audit-execution-section__fairness-status--${equalOpportunityResult.variant}`}
                  >
                    {equalOpportunityResult.label}
                  </span>
                </div>
              </div>
              <div className="audit-execution-section__stat">
                <p className="audit-execution-section__stat-label">Equalized Odds</p>
                <div className="audit-execution-section__fairness-row">
                  <p className="audit-execution-section__stat-value">
                    {FAIRNESS_RESULT.equalizedOdds}
                  </p>
                  <span
                    className={`audit-execution-section__fairness-status audit-execution-section__fairness-status--${equalizedOddsResult.variant}`}
                  >
                    {equalizedOddsResult.label}
                  </span>
                </div>
              </div>
            </div>
          </section>

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
              </div>
            </div>
          </section>

          <section className="audit-execution-section__deliverables">
            <h2 className="audit-execution-section__result-title">산출물 선택</h2>

            <div className="audit-execution-section__deliverable-grid">
              {DELIVERABLES.map((deliverable) => {
                const selected = selectedDeliverables.has(deliverable.id);

                return (
                  <button
                    key={deliverable.id}
                    type="button"
                    className={`audit-execution-section__deliverable-card${selected ? ' audit-execution-section__deliverable-card--selected' : ''}`}
                    onClick={() => toggleDeliverable(deliverable.id)}
                  >
                    <span
                      className={`audit-execution-section__deliverable-file audit-execution-section__deliverable-file--${deliverable.fileType.toLowerCase()}`}
                    >
                      {deliverable.fileType}
                    </span>
                    <span className="audit-execution-section__deliverable-label">
                      {deliverable.label}
                    </span>
                    <span
                      className={`audit-execution-section__deliverable-check${selected ? ' audit-execution-section__deliverable-check--on' : ''}`}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="audit-execution-section__deliverable-summary">
              <p className="audit-execution-section__deliverable-summary-count">
                {selectedDeliverableCount}/{DELIVERABLES.length}개 선택하셨습니다.
              </p>
              <p className="audit-execution-section__deliverable-summary-note">
                추후에 모니터링 페이지에서 재선택할 수 있습니다.
              </p>
            </div>

            <div className="audit-execution-section__generate-bar">
              <button
                type="button"
                className="audit-execution-section__generate-button"
                disabled={selectedDeliverableCount === 0}
              >
                보고서 생성 →
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default AuditExecutionSection;
