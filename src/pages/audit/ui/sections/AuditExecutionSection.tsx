import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';

import {
  uploadModel,
  uploadDataset,
  updateSensitiveAttributes,
  type ModelType,
} from '../../../../features/audit/api/modelApi';
import {
  startAudit,
  waitForAuditCompletion,
  getAudits,
  getFairness,
  getExplainability,
  saveSelfCheckAnswers,
  waitForRegulationMappings,
  type FairlearnResultItem,
  type ShapMetricItem,
  type SelfCheckItemCode,
  type RegulationMappingItem,
} from '../../../../features/audit/api/auditApi';
import StepIndicator from '../StepIndicator';

import './AuditExecutionSection.css';

type ModelMode = 'new' | 'update';
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

const DEFAULT_SELF_CHECK: Record<SelfCheckItemCode, SelfCheckAnswer> = {
  NOTICE: null,
  OBJECTION: null,
  OVERSIGHT: null,
  RISK_MANAGEMENT: null,
  DOCUMENTATION: null,
};

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

const DEFAULT_SELECTED_DELIVERABLES = new Set<string>();

type ShapMetricCode = ShapMetricItem['metricCode'];
type ShapStatus = ShapMetricItem['status'];

const SHAP_METRIC_LABEL: Record<ShapMetricCode, string> = {
  SENSITIVE_CONTRIB: '민감변수 기여비율 (SENSITIVE_CONTRIB)',
  GLOBAL_STABILITY: '설명 일관성 (GLOBAL_STABILITY)',
  FIDELITY: '설명 충실성 (FIDELITY)',
};

const SHAP_STATUS_LABEL: Record<ShapStatus, string> = {
  PASS: '충족',
  WARNING: '주의',
  REVIEW: '추가검토',
};

const SHAP_STATUS_VARIANT: Record<ShapStatus, 'good' | 'caution' | 'bad'> = {
  PASS: 'good',
  WARNING: 'caution',
  REVIEW: 'bad',
};

type FairlearnMetricCode = FairlearnResultItem['metricCode'];
type FairlearnStatus = FairlearnResultItem['status'];

function groupFairnessByAttribute(
  results: FairlearnResultItem[],
): [string, FairlearnResultItem[]][] {
  return Array.from(
    results.reduce((groups, item) => {
      const list = groups.get(item.attribute) ?? [];
      list.push(item);
      groups.set(item.attribute, list);
      return groups;
    }, new Map<string, FairlearnResultItem[]>()),
  );
}

const FAIRNESS_ATTRIBUTE_LABEL: Record<string, string> = {
  CODE_GENDER: '성별 (CODE_GENDER)',
  AGE_GROUP: '연령대 (AGE_GROUP)',
};

const FAIRNESS_METRIC_LABEL: Record<FairlearnMetricCode, string> = {
  DEMOGRAPHIC_PARITY: 'Demographic Parity',
  EQUAL_OPPORTUNITY: 'Equal Opportunity',
  EQUALIZED_ODDS: 'Equalized Odds',
  PROPORTIONAL_PARITY: '비례성 패리티 (Proportional Parity, 80% Rule)',
  FPR_PARITY: '거짓 양성률 패리티 (FPR Parity)',
  FDR_PARITY: '거짓 발견율 패리티 (FDR Parity)',
  FOR_PARITY: '거짓 누락률 패리티 (FOR Parity)',
};

const FAIRNESS_STATUS_LABEL: Record<FairlearnStatus, string> = {
  PASS: '정상',
  REVIEW: '추가검토',
  FAIL: '기준초과',
};

const FAIRNESS_STATUS_VARIANT: Record<FairlearnStatus, 'good' | 'warn' | 'bad'> = {
  PASS: 'good',
  REVIEW: 'warn',
  FAIL: 'bad',
};

interface AuditExecutionSectionProps {
  // 지정되면 새 감사를 실행하는 대신 이미 완료된 감사의 결과를 조회해서 보여준다.
  viewAuditId?: number;
}

function AuditExecutionSection({ viewAuditId }: AuditExecutionSectionProps) {
  const isViewMode = viewAuditId != null;

  const [modelMode, setModelMode] = useState<ModelMode>('new');
  const [modelName, setModelName] = useState('');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [auditDatasetFile, setAuditDatasetFile] = useState<File | null>(null);
  const [sensitiveColumns, setSensitiveColumns] = useState<Set<string>>(
    () => new Set(),
  );
  const [manualColumnInput, setManualColumnInput] = useState('');
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  // Validation 데이터셋은 선택 사항이다 — 안 켜면 기존과 동일하게 MANUAL 임계값(0.5)으로 동작한다.
  const [useValidationDataset, setUseValidationDataset] = useState(false);
  const [validationDatasetFile, setValidationDatasetFile] =
    useState<File | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [shapMetrics, setShapMetrics] = useState<ShapMetricItem[]>([]);
  const [fairnessResults, setFairnessResults] = useState<
    FairlearnResultItem[]
  >([]);

  const [selfCheckAnswers, setSelfCheckAnswers] =
    useState<Record<SelfCheckItemCode, SelfCheckAnswer>>(DEFAULT_SELF_CHECK);
  const [isSelfCheckSubmitting, setIsSelfCheckSubmitting] = useState(false);
  const [isSelfCheckSubmitted, setIsSelfCheckSubmitted] = useState(false);
  const [selfCheckError, setSelfCheckError] = useState<string | null>(null);

  const [matchedArticles, setMatchedArticles] = useState<
    RegulationMappingItem[]
  >([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  const [isLoadingExisting, setIsLoadingExisting] = useState(isViewMode);

  // viewAuditId가 바뀌면(알림/최근 이력에서 다른 감사로 연속 이동) 이전 감사의 결과가
  // 잠시 남아있지 않도록 렌더링 중에 바로 리셋한다. 이펙트 안에서 동기적으로 setState를
  // 호출하면 불필요한 추가 렌더가 발생하므로, React가 권장하는 "props 변경 시 렌더링
  // 중 상태 조정" 패턴을 사용한다.
  const [prevViewAuditId, setPrevViewAuditId] = useState(viewAuditId);
  if (viewAuditId !== prevViewAuditId) {
    setPrevViewAuditId(viewAuditId);
    setIsLoadingExisting(viewAuditId != null);
    setIsAnalyzed(false);
    setAnalysisError(null);
    setShapMetrics([]);
    setFairnessResults([]);
    setSelfCheckAnswers(DEFAULT_SELF_CHECK);
    setIsSelfCheckSubmitted(false);
    setSelfCheckError(null);
    setMatchedArticles([]);
  }

  const [runningAuditId, setRunningAuditId] = useState<number | null>(null);
  const [runningStep, setRunningStep] = useState(2);

  // auditId는 새로 실행한 감사(runningAuditId) 또는 조회 중인 기존 감사(viewAuditId) 중
  // 현재 화면에 결과가 떠 있는 쪽을 가리킨다 — 자율점검 제출/조회는 이 값을 기준으로 한다.
  const auditId = viewAuditId ?? runningAuditId;

  // 분석 중(currentStep 3=SHAP 분석 중 → 4=Fairlearn 분석 중) 진행 상황을 보여주기
  // 위해 짧은 간격으로 currentStep을 조회한다. 이 값의 의미는
  // AuditOverviewSection의 STEP_LABEL과 동일해야 한다. 완료 여부 판단은
  // handleRunAnalysis의 waitForAuditCompletion이 그대로 담당하고, 이건 화면 표시용이다.
  useEffect(() => {
    if (!isAnalyzing || runningAuditId == null) return;

    const timer = window.setInterval(() => {
      getAudits()
        .then((audits) => {
          const current = audits.find((item) => item.auditId === runningAuditId);
          if (current) setRunningStep(current.currentStep);
        })
        .catch(() => {});
    }, 2000);

    return () => window.clearInterval(timer);
  }, [isAnalyzing, runningAuditId]);

  // 알림/최근 감사 이력에서 특정 감사를 보러 온 경우, 새로 실행하는 대신
  // 그 감사의 실제 SHAP/Fairlearn 결과를 조회해서 STEP2~4 결과 영역에 그대로 채운다.
  useEffect(() => {
    if (viewAuditId == null) return;

    // 뒤늦게 도착한 이전 요청의 응답이 최신 화면을 덮어쓰지 않도록 취소 플래그를 둔다.
    let cancelled = false;

    Promise.all([
      getExplainability(viewAuditId),
      getFairness(viewAuditId),
    ])
      .then(([explainability, fairness]) => {
        if (cancelled) return;
        setShapMetrics(explainability.metrics);
        setFairnessResults(fairness.results);
        setIsAnalyzed(true);
      })
      .catch(() => {
        if (!cancelled) setAnalysisError('감사 결과를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingExisting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [viewAuditId]);

  const [selectedDeliverables, setSelectedDeliverables] = useState<Set<string>>(
    () => new Set(DEFAULT_SELECTED_DELIVERABLES),
  );

  const modelFileInputRef = useRef<HTMLInputElement>(null);
  const auditDatasetFileInputRef = useRef<HTMLInputElement>(null);
  const validationDatasetFileInputRef = useRef<HTMLInputElement>(null);

  const answeredCount = useMemo(
    () => Object.values(selfCheckAnswers).filter((answer) => answer !== null).length,
    [selfCheckAnswers],
  );
  const unansweredCount = SELF_CHECK_ITEMS.length - answeredCount;
  const isSelfCheckComplete = unansweredCount === 0;

  const selectedDeliverableCount = selectedDeliverables.size;

  const fairnessGroups = useMemo(
    () => groupFairnessByAttribute(fairnessResults),
    [fairnessResults],
  );

  // 분석 진행 상태와 결과는 이 컴포넌트 state 에만 있어서 새로고침하면 그대로 사라진다.
  // 실행 중이거나 결과가 떠 있을 때만 브라우저 기본 이탈 경고를 붙인다.
  useEffect(() => {
    if (!isAnalyzing && !isAnalyzed) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // 경고 문구는 브라우저가 고정하므로 커스터마이즈할 수 없다.
      // 다만 구형 브라우저는 returnValue 가 설정돼야 경고를 띄운다.
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAnalyzing, isAnalyzed]);

  // AI 서버가 아직 XGBoost(.json) 외 포맷을 로드하지 못해 .pkl/.joblib은 실행 단계에서 막힌다.
  // 여기서도 같은 기준으로 미리 알려준다 (resolveModelType 과 일치시킬 것).
  const isModelFileSupported = useMemo(() => {
    if (!modelFile) return null;
    return /\.json$/i.test(modelFile.name);
  }, [modelFile]);

  const handleModelDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) setModelFile(file);
  };

  // 헤더 한 줄만 읽으면 되므로 파일 앞부분만 잘라서 읽는다 — 큰 CSV 전체를 메모리에 올리지 않는다.
  const HEADER_PREVIEW_BYTES = 8192;

  const parseCsvHeader = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
      const columns = firstLine
        .split(',')
        .map((column) => column.trim())
        .filter(Boolean);
      setAvailableColumns(columns);
    };
    reader.readAsText(file.slice(0, HEADER_PREVIEW_BYTES));
  };

  const handleAuditDatasetFile = (file: File | null) => {
    setAuditDatasetFile(file);

    if (!file) {
      setAvailableColumns([]);
      return;
    }

    parseCsvHeader(file);
  };

  const handleAuditDatasetDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) handleAuditDatasetFile(file);
  };

  // Validation 데이터셋은 임계값 캘리브레이션 참고용일 뿐, 민감변수 선택 목록에는 영향을 주지 않는다
  // (민감변수는 감사 데이터 헤더에서만 고른다) — 그래서 헤더 파싱은 하지 않는다.
  const handleValidationDatasetDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) setValidationDatasetFile(file);
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

  const handleSelectSensitiveColumn = (event: ChangeEvent<HTMLSelectElement>) => {
    const column = event.target.value;
    if (!column) return;

    setSensitiveColumns((prev) => new Set(prev).add(column));
    event.target.value = '';
  };

  // .json 파일만 XGBoost로 확정할 수 있다. .pkl/.joblib은 XGBoost/LightGBM 등이 섞여있을 수 있어
  // 확장자만으로 단정하면 잘못된 modelType 이 저장될 위험이 있다. 모델 타입 선택 UI가 생기기 전까지는
  // 확실하지 않으면 null 을 돌려주고 실행을 막는다.
  const resolveModelType = (file: File): ModelType | null =>
    file.name.toLowerCase().endsWith('.json') ? 'XGBOOST' : null;

  const handleRunAnalysis = async () => {
    if (!modelFile || !auditDatasetFile || isAnalyzing) return;
    if (useValidationDataset && !validationDatasetFile) return;

    const modelType = resolveModelType(modelFile);
    if (!modelType) {
      setAnalysisError(
        '.pkl/.joblib 모델은 아직 모델 타입을 자동으로 판단할 수 없습니다. .json(XGBoost) 파일로 업로드해주세요.',
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    // 이전 실행 결과가 남아있으면 새 실행이 실패했을 때 옛 결과가 그대로 보이므로 먼저 지운다.
    setIsAnalyzed(false);
    setShapMetrics([]);
    setFairnessResults([]);
    setRunningAuditId(null);
    setRunningStep(2);
    setSelfCheckAnswers(DEFAULT_SELF_CHECK);
    setIsSelfCheckSubmitted(false);
    setSelfCheckError(null);
    setMatchedArticles([]);

    try {
      const model = await uploadModel(
        modelFile,
        modelName || modelFile.name,
        modelType,
      );

      const dataset = await uploadDataset(
        model.modelId,
        auditDatasetFile,
        'AUDIT',
      );

      await updateSensitiveAttributes(
        model.modelId,
        dataset.datasetId,
        [...sensitiveColumns],
      );

      // Validation 데이터셋을 켠 경우에만 별도로 올려서 임계값 산출에 쓰고,
      // 안 켠 경우(기본값)는 기존과 동일하게 MANUAL + 0.5 고정 임계값을 쓴다.
      let started;
      if (useValidationDataset && validationDatasetFile) {
        const validationDataset = await uploadDataset(
          model.modelId,
          validationDatasetFile,
          'VALIDATION',
        );

        started = await startAudit({
          modelId: model.modelId,
          datasetId: dataset.datasetId,
          auditName: modelName || modelFile.name,
          thresholdMethod: 'VALIDATION_DATASET',
          validationDatasetId: validationDataset.datasetId,
        });
      } else {
        started = await startAudit({
          modelId: model.modelId,
          datasetId: dataset.datasetId,
          auditName: modelName || modelFile.name,
          thresholdMethod: 'MANUAL',
          manualThreshold: 0.5,
        });
      }

      setRunningAuditId(started.auditId);

      const completed = await waitForAuditCompletion(started.auditId);

      if (completed.status === 'FAILED') {
        throw new Error(
          '감사 분석이 실패했습니다. 백엔드·AI 서버 로그를 확인해주세요.',
        );
      }

      const [fairness, explainability] = await Promise.all([
        getFairness(started.auditId),
        getExplainability(started.auditId),
      ]);

      setFairnessResults(fairness.results);
      setShapMetrics(explainability.metrics);
      setIsAnalyzed(true);
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : '감사 분석 실행 중 오류가 발생했습니다.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelfCheckAnswer = (
    id: SelfCheckItemCode,
    answer: SelfCheckAnswer,
  ) => {
    setIsSelfCheckSubmitted(false);
    setSelfCheckAnswers((prev) => ({ ...prev, [id]: answer }));
  };

  const handleSelfCheckSubmit = async () => {
    if (!auditId || !isSelfCheckComplete || isSelfCheckSubmitting) return;

    setIsSelfCheckSubmitting(true);
    setSelfCheckError(null);

    try {
      const answers = SELF_CHECK_ITEMS.map((item) => ({
        itemCode: item.id,
        answer: selfCheckAnswers[item.id] === 'yes',
      }));

      await saveSelfCheckAnswers(auditId, answers);
      setIsSelfCheckSubmitted(true);

      setIsLoadingMatches(true);
      const mappings = await waitForRegulationMappings(auditId);
      setMatchedArticles(mappings);
    } catch (error) {
      setSelfCheckError(
        error instanceof Error
          ? error.message
          : '자율점검 제출 중 오류가 발생했습니다.',
      );
    } finally {
      setIsSelfCheckSubmitting(false);
      setIsLoadingMatches(false);
    }
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

  return (
    <div className="audit-execution-section">
      <StepIndicator
        doneSteps={
          isSelfCheckSubmitted ? [1, 2, 3, 4] : isAnalyzed ? [1, 2, 3] : [1]
        }
        activeSteps={
          isSelfCheckSubmitted ? [5] : isAnalyzed ? [4] : [2, 3, 4]
        }
      />

      {!isViewMode && !isAnalyzed && (
      <>
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
              {modelFile ? modelFile.name : 'XGBoost 모델(.json) 드래그앤드롭 또는 업로드'}
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
              accept=".json"
              className="audit-execution-section__hidden-input"
              onChange={(event) => setModelFile(event.target.files?.[0] ?? null)}
            />
          </div>

          <p
            className={`audit-execution-section__hint${isModelFileSupported === null ? '' : isModelFileSupported ? ' audit-execution-section__hint--valid' : ' audit-execution-section__hint--invalid'}`}
          >
            지원 형식: XGBoost(.json, v1.0+) — .pkl / .joblib 은 준비 중입니다
          </p>
        </div>

        <div className="audit-execution-section__upload-card">
          <h2 className="audit-execution-section__upload-title">
            ② 감사 데이터 + 민감변수 지정
          </h2>

          <div
            className="audit-execution-section__dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleAuditDatasetDrop}
          >
            <span className="audit-execution-section__dropzone-text">
              {auditDatasetFile ? auditDatasetFile.name : 'audit_dataset.csv 드래그앤드롭 또는 업로드'}
            </span>
            <button
              type="button"
              className="audit-execution-section__upload-trigger"
              onClick={() => auditDatasetFileInputRef.current?.click()}
            >
              업로드
            </button>
            <input
              ref={auditDatasetFileInputRef}
              type="file"
              accept=".csv"
              className="audit-execution-section__hidden-input"
              onChange={(event) =>
                handleAuditDatasetFile(event.target.files?.[0] ?? null)
              }
            />
          </div>

          <p className="audit-execution-section__field-label">
            민감변수 컬럼
            <span className="audit-execution-section__field-label-count">
              {sensitiveColumns.size}개
            </span>
          </p>

          {availableColumns.length > 0 ? (
            <div className="audit-execution-section__sensitive-input-row">
              <select
                className="audit-execution-section__select"
                defaultValue=""
                onChange={handleSelectSensitiveColumn}
              >
                <option value="" disabled>
                  컬럼 선택
                </option>
                {availableColumns
                  .filter((column) => !sensitiveColumns.has(column))
                  .map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
              </select>
            </div>
          ) : (
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
                placeholder="감사 데이터를 업로드하면 컬럼을 선택할 수 있어요"
              />
              <button
                type="button"
                className="audit-execution-section__tag-add-button"
                onClick={handleAddManualColumn}
              >
                추가
              </button>
            </div>
          )}

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

          <label className="audit-execution-section__checkbox-label">
            <input
              type="checkbox"
              checked={useValidationDataset}
              onChange={(event) => {
                setUseValidationDataset(event.target.checked);
                if (!event.target.checked) setValidationDatasetFile(null);
              }}
            />
            Validation 데이터셋으로 임계값을 더 정확하게 산출 (선택)
          </label>

          {useValidationDataset && (
            <div
              className="audit-execution-section__dropzone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleValidationDatasetDrop}
            >
              <span className="audit-execution-section__dropzone-text">
                {validationDatasetFile
                  ? validationDatasetFile.name
                  : 'valid_processed.csv 드래그앤드롭 또는 업로드'}
              </span>
              <button
                type="button"
                className="audit-execution-section__upload-trigger"
                onClick={() => validationDatasetFileInputRef.current?.click()}
              >
                업로드
              </button>
              <input
                ref={validationDatasetFileInputRef}
                type="file"
                accept=".csv"
                className="audit-execution-section__hidden-input"
                onChange={(event) =>
                  setValidationDatasetFile(event.target.files?.[0] ?? null)
                }
              />
            </div>
          )}
        </div>
      </div>

      <div className="audit-execution-section__run-bar">
        <button
          type="button"
          className="audit-execution-section__run-button"
          disabled={
            !modelFile ||
            !auditDatasetFile ||
            isAnalyzing ||
            (useValidationDataset && !validationDatasetFile)
          }
          onClick={handleRunAnalysis}
        >
          {isAnalyzing ? '분석 중…' : '감사 분석 실행'}
        </button>
      </div>
      </>
      )}

      {analysisError && (
        <p className="audit-execution-section__empty" role="alert">
          {analysisError}
        </p>
      )}

      {isAnalyzing || (isViewMode && isLoadingExisting) ? (
        <div
          className="audit-execution-section__loading"
          role="status"
          aria-live="polite"
        >
          <span className="audit-execution-section__spinner" aria-hidden="true" />
          <p className="audit-execution-section__loading-text">
            {isViewMode
              ? '감사 결과를 불러오고 있습니다. 잠시만 기다려주세요.'
              : '감사 분석을 실행하고 있습니다. 잠시만 기다려주세요.'}
          </p>

          {isAnalyzing && !isViewMode && (
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
      ) : !isAnalyzed ? (
        analysisError ? null : (
          <p className="audit-execution-section__empty">
            {isViewMode
              ? '조회할 감사 결과가 없습니다.'
              : '모델과 감사 데이터를 업로드하고 분석을 실행하면 결과가 표시됩니다.'}
          </p>
        )
      ) : (
        <>
          <section className="audit-execution-section__result-card">
            <h2 className="audit-execution-section__result-title">
              STEP 2 결과 — 설명가능성 3지표
            </h2>

            {shapMetrics.length === 0 ? (
              <p className="audit-execution-section__empty">
                SHAP 분석 결과가 없습니다.
              </p>
            ) : (
              <div className="audit-execution-section__stat-grid">
                {shapMetrics.map((metric) => (
                  <div key={metric.metricCode} className="audit-execution-section__stat">
                    <p className="audit-execution-section__stat-label">
                      {SHAP_METRIC_LABEL[metric.metricCode]}
                    </p>
                    <div className="audit-execution-section__fairness-row">
                      <p className="audit-execution-section__stat-value">{metric.value}</p>
                      <span
                        className={`audit-execution-section__fairness-status audit-execution-section__fairness-status--${SHAP_STATUS_VARIANT[metric.status]}`}
                      >
                        {SHAP_STATUS_LABEL[metric.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="audit-execution-section__result-card">
            <h2 className="audit-execution-section__result-title">
              STEP 3 결과 — Fairlearn 공정성{' '}
              <span className="audit-execution-section__result-note">
                (편향은 확정이 아닌 추가검토 신호)
              </span>
            </h2>
            {fairnessGroups.length === 0 ? (
              <p className="audit-execution-section__empty">
                Fairlearn 감사 결과가 없습니다.
              </p>
            ) : (
              fairnessGroups.map(([attribute, metrics]) => (
                <div key={attribute} className="audit-execution-section__fairness-group">
                  <p className="audit-execution-section__fairness-group-title">
                    {FAIRNESS_ATTRIBUTE_LABEL[attribute] ?? attribute}
                  </p>
                  {metrics[0]?.note && (
                    <p className="audit-execution-section__fairness-note">
                      {metrics[0].note}
                    </p>
                  )}
                  <div className="audit-execution-section__stat-grid">
                    {metrics.map((metric) => (
                      <div
                        key={metric.metricCode}
                        className="audit-execution-section__stat"
                      >
                        <p className="audit-execution-section__stat-label">
                          {FAIRNESS_METRIC_LABEL[metric.metricCode]}
                        </p>
                        <div className="audit-execution-section__fairness-row">
                          <p className="audit-execution-section__stat-value">
                            {metric.value}
                          </p>
                          <span
                            className={`audit-execution-section__fairness-status-text audit-execution-section__fairness-status-text--${FAIRNESS_STATUS_VARIANT[metric.status]}`}
                          >
                            {FAIRNESS_STATUS_LABEL[metric.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
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
                    disabled={
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
                  STEP 4 — 매칭 조항 (실제 조항명·원문 인용)
                </h3>
                {isLoadingMatches ? (
                  <p className="audit-execution-section__empty">
                    매칭 조항을 불러오는 중입니다…
                  </p>
                ) : matchedArticles.length === 0 ? (
                  <p className="audit-execution-section__empty">
                    {isSelfCheckSubmitted
                      ? '매칭된 조항이 없습니다.'
                      : '자율점검을 제출하면 매칭 결과가 표시됩니다.'}
                  </p>
                ) : (
                  <ul className="audit-execution-section__matched-list">
                    {matchedArticles.map((article) => (
                      <li
                        key={article.mappingId}
                        className="audit-execution-section__matched-item"
                      >
                        <p className="audit-execution-section__matched-title">
                          {article.regulation} {article.article}
                        </p>
                        <p className="audit-execution-section__matched-quote">
                          「{article.content}」
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
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