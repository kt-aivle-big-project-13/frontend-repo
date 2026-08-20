import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  uploadModel,
  uploadDataset,
  updateSensitiveAttributes,
  getModels,
  getModelDatasets,
  type ModelType,
  type ModelSummaryResponse,
  type DatasetSummaryResponse,
} from '../../../../features/audit/api/modelApi';
import { startAudit } from '../../../../features/audit/api/auditApi';
import { isDemoGuest, useAuthStore } from '../../../../entities/user/model/authStore';
import { extractApiErrorMessage } from '../../../../shared/api/client';
import { useSubmissionLockStore } from '../../../../shared/model/submissionLockStore';
import StepIndicator from '../StepIndicator';

import './AuditFlow.css';

type ModelMode = 'new' | 'update';

// 이전 버전이 "V숫자" 형태면 다음 숫자로, "1.0.0" 같은 시맨틱 버전이면 메이저 버전을 올려
// 제안한다. 그 외 형식은 사용자가 직접 고치도록 그대로 복사해서 보여준다.
function suggestNextVersion(previousVersion: string): string {
  const trimmed = previousVersion.trim();

  const vMatch = /^V(\d+)$/i.exec(trimmed);
  if (vMatch) return `V${Number(vMatch[1]) + 1}`;

  const semverMatch = /^(\d+)\.(\d+)\.(\d+)$/.exec(trimmed);
  if (semverMatch) return `${Number(semverMatch[1]) + 1}.0.0`;

  return trimmed;
}

interface SensitiveColumnPickerProps {
  availableColumns: string[];
  selectedColumns: Set<string>;
  onAdd: (column: string) => void;
}

// 컬럼이 많은 데이터셋에서 원하는 민감변수를 빠르게 찾을 수 있도록 검색 가능한 드롭다운으로 제공한다.
function SensitiveColumnPicker({
  availableColumns,
  selectedColumns,
  onAdd,
}: SensitiveColumnPickerProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const options = availableColumns.filter(
    (column) =>
      !selectedColumns.has(column) &&
      column.toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (column: string) => {
    onAdd(column);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="audit-execution-section__combobox" ref={containerRef}>
      <input
        type="text"
        className="audit-execution-section__text-input audit-execution-section__combobox-input"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && options.length > 0) {
            event.preventDefault();
            handleSelect(options[0]);
          }
          if (event.key === 'Escape') setIsOpen(false);
        }}
        placeholder="컬럼 검색"
      />

      {isOpen && (
        <ul className="audit-execution-section__combobox-list">
          {options.length > 0 ? (
            options.map((column) => (
              <li key={column}>
                <button
                  type="button"
                  className="audit-execution-section__combobox-option"
                  onClick={() => handleSelect(column)}
                >
                  {column}
                </button>
              </li>
            ))
          ) : (
            <li className="audit-execution-section__combobox-empty">
              일치하는 컬럼이 없습니다
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function formatUploadedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// 대소문자와 공백 표기 차이(예: "My Model" vs "mymodel")를 모두 무시하고 비교하기 위해
// 앞뒤 공백만 지우는 trim이 아니라 모든 공백을 제거한다.
function normalizeModelName(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

// 백엔드 ai_models.model_name 컬럼 길이(varchar(100))와 맞춘다 — 넘으면 DB 저장 시 500 에러가 난다.
const MODEL_NAME_MAX_LENGTH = 100;

function AuditExecutionSection() {
  const navigate = useNavigate();
  const lockSubmission = useSubmissionLockStore((state) => state.lock);
  const unlockSubmission = useSubmissionLockStore((state) => state.unlock);

  // 제출이 백그라운드에서 끝났을 때, 사용자가 이미 이 화면을 벗어났다면(홈 등 다른 곳으로
  // 이동) STEP3로 강제 이동시키지 않기 위한 마운트 여부 추적. handleStartAudit은 일반
  // 비동기 함수라 컴포넌트가 언마운트돼도 계속 실행되므로, 완료 시점에 이 값을 확인한다.
  //
  // StrictMode(개발 모드)는 마운트 시 이 effect를 설치→정리→재설치 순으로 한 번 더 실행해
  // 정리 누락을 잡아낸다. 설치 시점에 true로 재설정하지 않으면, 그 시뮬레이션 도중 정리
  // 단계에서 false로 바뀐 값이 그대로 남아 실제로는 계속 마운트돼 있는 동안에도 영구히
  // false로 고정되어 navigate()가 다시는 실행되지 않는다.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [searchParams] = useSearchParams();
  const assessmentIdParam = searchParams.get('assessmentId');
  const parsedAssessmentId = Number(assessmentIdParam);
  const assessmentId =
    Number.isSafeInteger(parsedAssessmentId) && parsedAssessmentId > 0
      ? parsedAssessmentId
      : undefined;

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

  // 버전업(기존 모델) 관련 상태 — 이전 모델을 고르면 모델명/버전을 자동 채우고,
  // 그 계열의 최근 감사 데이터셋을 재사용 후보로 가져온다.
  const [previousModels, setPreviousModels] = useState<ModelSummaryResponse[]>([]);
  const [isLoadingPreviousModels, setIsLoadingPreviousModels] = useState(false);
  const [selectedPreviousModelId, setSelectedPreviousModelId] = useState<number | null>(null);
  const [newVersion, setNewVersion] = useState('');
  const [reusedDataset, setReusedDataset] = useState<DatasetSummaryResponse | null>(null);
  const [isLoadingReusedDataset, setIsLoadingReusedDataset] = useState(false);
  const [useNewDatasetUpload, setUseNewDatasetUpload] = useState(false);
  const [useNewModelUpload, setUseNewModelUpload] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 신규 모델명이 기존에 감사했던 모델과 겹치는지 검증하기 위한 기존 모델명 목록.
  // 모드/선택과 무관하게 마운트 시 한 번만 가져온다.
  const [existingModelNames, setExistingModelNames] = useState<Set<string>>(
    () => new Set(),
  );

  const modelFileInputRef = useRef<HTMLInputElement>(null);
  const auditDatasetFileInputRef = useRef<HTMLInputElement>(null);
  const validationDatasetFileInputRef = useRef<HTMLInputElement>(null);

  // 업로드·감사 시작 요청이 나가는 동안 새로고침하면 처음부터 다시 올려야 하므로 이탈을 경고한다.
  useEffect(() => {
    if (!isSubmitting) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSubmitting]);

  useEffect(() => {
    getModels()
      .then((models) =>
        setExistingModelNames(
          new Set(models.map((model) => normalizeModelName(model.modelName))),
        ),
      )
      .catch(() => setExistingModelNames(new Set()));
  }, []);

  const selectedPreviousModel = useMemo(
    () => previousModels.find((model) => model.modelId === selectedPreviousModelId) ?? null,
    [previousModels, selectedPreviousModelId],
  );

  // 모델명 입력을 비워두면 업로드한 파일명(또는 재사용 중인 이전 모델명)이 실제 저장되는 이름이
  // 된다 (handleStartAudit 참고). 중복/길이 검증이 화면에 보이는 입력값만 보고 판단하면, 입력칸을
  // 비운 채 파일명만으로 검증을 우회할 수 있으므로 반드시 이 값을 기준으로 검증해야 한다.
  const fallbackModelName = modelFile?.name ?? selectedPreviousModel?.modelName ?? '';
  const effectiveModelName = modelName || fallbackModelName;

  // 신규 등록 모드에서만 검증한다 — 버전업은 이전 모델과 같은 이름을 이어받는 게 정상 흐름이다.
  const isDuplicateModelName = useMemo(() => {
    if (modelMode !== 'new') return false;
    const normalized = normalizeModelName(effectiveModelName);
    if (!normalized) return false;
    return existingModelNames.has(normalized);
  }, [modelMode, effectiveModelName, existingModelNames]);

  // 모델명 길이는 모드와 무관하게 검증한다 — 버전업에서도 이 입력값이 그대로 저장된다.
  const isModelNameTooLong = effectiveModelName.length > MODEL_NAME_MAX_LENGTH;
  const isModelNameInvalid = isDuplicateModelName || isModelNameTooLong;
  const modelNameErrorMessage = isDuplicateModelName
    ? '이미 감사한 모델과 이름이 중복됩니다. 다른 모델명을 입력해주세요.'
    : isModelNameTooLong
      ? `모델명은 ${MODEL_NAME_MAX_LENGTH}자를 초과할 수 없습니다. (현재 ${effectiveModelName.length}자)`
      : null;

  // 토스트는 글자 수 같은 세부 수치 없이 고정된 문구로 띄운다 — modelNameErrorMessage를 그대로
  // key로 쓰면 초과 상태에서 타이핑할 때마다(글자 수가 바뀌므로) 매번 다시 애니메이션된다.
  const modelNameToastMessage = isDuplicateModelName
    ? '이미 등록된 모델명입니다. 다른 이름을 입력해주세요.'
    : isModelNameTooLong
      ? `모델명은 ${MODEL_NAME_MAX_LENGTH}자를 초과할 수 없습니다.`
      : null;

  const handleModelModeChange = (mode: ModelMode) => {
    setModelMode(mode);
    setSelectedPreviousModelId(null);
    setNewVersion('');
    setReusedDataset(null);
    setUseNewDatasetUpload(false);
    setUseNewModelUpload(false);
    setModelName('');
    setModelFile(null);
    setAuditDatasetFile(null);
    setAvailableColumns([]);
    setSensitiveColumns(new Set());

    if (mode !== 'update') {
      setPreviousModels([]);
      return;
    }

    // "기존(버전업)"으로 전환할 때 내 모델 목록(계열당 최신 버전)을 가져와 선택지로 보여준다.
    setIsLoadingPreviousModels(true);
    getModels()
      .then(setPreviousModels)
      .catch(() => setPreviousModels([]))
      .finally(() => setIsLoadingPreviousModels(false));
  };

  // 드롭다운 선택과 게스트 자동 선택이 같은 상태를 채워야 해서 한곳에 모았다.
  const selectPreviousModel = (model: ModelSummaryResponse) => {
    setSelectedPreviousModelId(model.modelId);
    setModelName(model.modelName);
    setNewVersion(suggestNextVersion(model.currentVersion));
    setUseNewDatasetUpload(false);
    setUseNewModelUpload(false);
    setModelFile(null);
    setReusedDataset(null);
    setAuditDatasetFile(null);
    setAvailableColumns([]);
    setSensitiveColumns(new Set());

    setIsLoadingReusedDataset(true);
    getModelDatasets(model.modelId, 'AUDIT')
      .then((datasets) => {
        if (!isMountedRef.current) return;
        const latest = datasets[0] ?? null;
        setReusedDataset(latest);
        if (!latest) setUseNewDatasetUpload(true);
      })
      .catch(() => {
        if (!isMountedRef.current) return;
        setReusedDataset(null);
        setUseNewDatasetUpload(true);
      })
      .finally(() => {
        if (isMountedRef.current) setIsLoadingReusedDataset(false);
      });
  };

  const handleSelectPreviousModel = (event: ChangeEvent<HTMLSelectElement>) => {
    const modelId = Number(event.target.value);
    const model = previousModels.find((item) => item.modelId === modelId);
    if (!model) return;

    selectPreviousModel(model);
  };

  // 시연용 게스트에게는 계정 발급과 함께 데모 모델·데이터셋이 이미 만들어져 있다. 업로드 화면을
  // 빈 채로 열면 시연 도중에 파일을 다시 올려야 하므로, 그 모델을 고른 상태로 열어 둔다.
  // 모델·데이터셋·민감변수가 모두 재사용되어 업로드 없이 바로 감사를 시작할 수 있다.
  const isGuest = useAuthStore((state) => isDemoGuest(state.user));

  useEffect(() => {
    if (!isGuest) return;

    getModels()
      .then((models) => {
        if (!isMountedRef.current) return;

        // 고를 모델이 없으면 손대지 않고 신규 업로드 화면을 그대로 둔다.
        const demoModel = models[0];
        if (!demoModel) return;

        setPreviousModels(models);
        setModelMode('update');
        selectPreviousModel(demoModel);
      })
      .catch(() => {
        if (isMountedRef.current) setPreviousModels([]);
      });
    // 마운트 시 한 번만 채운다 — 이후 사용자가 신규로 바꾸면 그 선택을 덮어쓰지 않는다.
  }, [isGuest]);

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
    setSensitiveColumns(new Set());

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

  const handleAddSensitiveColumn = (column: string) => {
    setSensitiveColumns((prev) => new Set(prev).add(column));
  };

  const handleAddManualColumn = () => {
    const column = manualColumnInput.trim();
    if (!column) return;

    setSensitiveColumns((prev) => new Set(prev).add(column));
    setManualColumnInput('');
  };

  // .json 파일만 XGBoost로 확정할 수 있다. .pkl/.joblib은 XGBoost/LightGBM 등이 섞여있을 수 있어
  // 확장자만으로 단정하면 잘못된 modelType 이 저장될 위험이 있다. 모델 타입 선택 UI가 생기기 전까지는
  // 확실하지 않으면 null 을 돌려주고 실행을 막는다.
  const resolveModelType = (file: File): ModelType | null =>
    file.name.toLowerCase().endsWith('.json') ? 'XGBOOST' : null;

  const isUpdateMode = modelMode === 'update';
  const willReuseDataset = isUpdateMode && reusedDataset != null && !useNewDatasetUpload;
  const willReuseModel = isUpdateMode && selectedPreviousModel != null && !useNewModelUpload;
  const isVersionSameAsPrevious =
    isUpdateMode &&
    selectedPreviousModel != null &&
    newVersion.trim().length > 0 &&
    newVersion.trim() === selectedPreviousModel.currentVersion.trim();

  const handleStartAudit = async () => {
    if (isSubmitting) return;
    if (isModelNameInvalid) return;
    if (!willReuseModel && !modelFile) return;
    if (isUpdateMode && !selectedPreviousModelId) return;
    if (!willReuseDataset && !auditDatasetFile) return;
    if (!willReuseDataset && sensitiveColumns.size === 0) return;
    if (useValidationDataset && !validationDatasetFile) return;

    const modelType = willReuseModel
      ? selectedPreviousModel!.modelType
      : modelFile
        ? resolveModelType(modelFile)
        : null;
    if (!modelType) {
      setSubmitError(
        '.pkl/.joblib 모델은 아직 모델 타입을 자동으로 판단할 수 없습니다. .json(XGBoost) 파일로 업로드해주세요.',
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    // 모델 업로드 → 데이터셋 업로드 → 감사 시작까지 여러 단계의 요청이 이어지는 동안
    // 로그아웃하면, 그 뒤에 나가는 요청이 401로 실패해 앞 단계(모델 생성 등)만 반영된
    // 채로 남을 수 있다. 그래서 이 구간 동안은 로그아웃을 막아둔다.
    lockSubmission();

    try {
      const model = await uploadModel(
        willReuseModel ? null : modelFile,
        effectiveModelName,
        modelType,
        isUpdateMode
          ? {
              version: newVersion || undefined,
              previousModelId: selectedPreviousModelId ?? undefined,
            }
          : undefined,
      );

      let datasetId: number;
      if (willReuseDataset && reusedDataset) {
        datasetId = reusedDataset.datasetId;
      } else {
        const dataset = await uploadDataset(model.modelId, auditDatasetFile!, 'AUDIT');
        await updateSensitiveAttributes(model.modelId, dataset.datasetId, [...sensitiveColumns]);
        datasetId = dataset.datasetId;
      }

      const auditName = effectiveModelName;

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
          assessmentId,
          modelId: model.modelId,
          datasetId,
          auditName,
          thresholdMethod: 'VALIDATION_DATASET',
          validationDatasetId: validationDataset.datasetId,
        });
      } else {
        started = await startAudit({
          assessmentId,
          modelId: model.modelId,
          datasetId,
          auditName,
          thresholdMethod: 'MANUAL',
          manualThreshold: 0.5,
        });
      }

      // 설명가능성·편향진단·고영향 리포트는 여기서 걸지 않는다. 백엔드가 분석이 끝나는
      // 시점에 같은 3종을 사전 생성하므로(ReportPreGenerationService.preGenerateAfterAnalysis),
      // 여기서 또 걸면 같은 보고서를 두 번 만든다.
      //
      // 이 시점은 분석이 막 시작한 때라 리포트가 참조할 분석 산출물이 아직 없고, 그래서
      // 리포트 쪽이 같은 계산을 처음부터 다시 하면서 분석과 CPU를 두고 경합한다. 실측에서
      // 이 경로의 설명가능성 리포트는 112초가 걸린 반면, 분석이 끝난 뒤 백엔드가 건 같은
      // 리포트는 산출물을 재사용해 13초에 끝났다.

      // 실제 SHAP/Fairlearn 분석은 오래 걸릴 수 있어, 여기서 기다리는 대신
      // STEP3(체크리스트 작성) 페이지로 바로 이동해 분석 진행 상황을 보여주면서
      // 자가점검 체크리스트를 함께 작성할 수 있게 한다.
      // 다만 사용자가 제출 도중 이미 이 화면을 벗어났다면(예: 홈으로 이동) 뒤늦게
      // 끝난 응답 때문에 지금 보고 있는 화면을 강제로 바꿔버리면 안 되므로, 마운트된
      // 상태일 때만 이동한다. 감사 자체는 이미 서버에 저장됐으니 나중에 "최근 감사"/
      // "진행중 감사" 목록에서 확인할 수 있다.
      if (isMountedRef.current) {
        navigate(`/audit/${started.auditId}`);
      }
    } catch (error) {
      setSubmitError(extractApiErrorMessage(error, '감사 시작 중 오류가 발생했습니다.'));
    } finally {
      setIsSubmitting(false);
      unlockSubmission();
    }
  };

  const isStartDisabled =
    (!willReuseModel && !modelFile) ||
    isSubmitting ||
    isModelNameInvalid ||
    (isUpdateMode && !selectedPreviousModelId) ||
    (isUpdateMode && newVersion.trim().length === 0) ||
    isVersionSameAsPrevious ||
    (!willReuseDataset && !auditDatasetFile) ||
    (!willReuseDataset && sensitiveColumns.size === 0) ||
    (useValidationDataset && !validationDatasetFile);

  return (
    <div className="audit-execution-section">
      <StepIndicator doneSteps={[1]} activeSteps={[2]} />

      {isSubmitting ? (
        <div
          className="audit-execution-section__loading"
          role="status"
          aria-live="polite"
        >
          <span className="audit-execution-section__spinner" aria-hidden="true" />
          <p className="audit-execution-section__loading-text">
            모델과 감사 데이터를 업로드하고 감사를 시작하는 중입니다. 잠시만 기다려주세요.
          </p>
        </div>
      ) : (
        <>
      <div className="audit-execution-section__upload-grid">
        <div className="audit-execution-section__upload-card">
          <div className="audit-execution-section__upload-header">
            <h2 className="audit-execution-section__upload-title">① 모델 업로드</h2>

            <div className="audit-execution-section__mode-toggle">
              <button
                type="button"
                className={`audit-execution-section__mode-button${modelMode === 'new' ? ' audit-execution-section__mode-button--active' : ''}`}
                onClick={() => handleModelModeChange('new')}
              >
                신규
              </button>
              <button
                type="button"
                className={`audit-execution-section__mode-button${modelMode === 'update' ? ' audit-execution-section__mode-button--active' : ''}`}
                onClick={() => handleModelModeChange('update')}
              >
                기존(버전업)
              </button>
            </div>
          </div>

          {isUpdateMode && (
            <>
              <label className="audit-execution-section__field-label" htmlFor="previous-model">
                이전 모델 선택
              </label>
              <select
                id="previous-model"
                className="audit-execution-section__select"
                value={selectedPreviousModelId ?? ''}
                onChange={handleSelectPreviousModel}
                disabled={isLoadingPreviousModels}
                style={{ marginBottom: 16 }}
              >
                <option value="" disabled>
                  {isLoadingPreviousModels
                    ? '모델 목록을 불러오는 중…'
                    : previousModels.length === 0
                      ? '버전업할 수 있는 기존 모델이 없습니다'
                      : '모델을 선택해주세요'}
                </option>
                {previousModels.map((model) => (
                  <option key={model.modelId} value={model.modelId}>
                    {model.modelName} ({model.currentVersion})
                  </option>
                ))}
              </select>

              {selectedPreviousModel && (
                <p className="audit-execution-section__version-row">
                  이전버전{' '}
                  <span className="audit-execution-section__version-badge">
                    {selectedPreviousModel.currentVersion}
                  </span>
                  <span className="audit-execution-section__version-arrow">→</span>
                  신규버전
                  <input
                    type="text"
                    className={`audit-execution-section__version-input${isVersionSameAsPrevious ? ' audit-execution-section__version-input--invalid' : ''}`}
                    value={newVersion}
                    onChange={(event) => setNewVersion(event.target.value)}
                    placeholder="예: V2"
                  />
                </p>
              )}

              {isVersionSameAsPrevious && (
                <p className="audit-execution-section__version-error">
                  버전 이름을 다르게 해주세요
                </p>
              )}
            </>
          )}

          <label className="audit-execution-section__field-label" htmlFor="model-name">
            모델명
          </label>
          <input
            id="model-name"
            type="text"
            className={`audit-execution-section__text-input${isModelNameInvalid ? ' audit-execution-section__text-input--invalid' : ''}`}
            value={modelName}
            onChange={(event) => setModelName(event.target.value)}
            placeholder="모델명을 입력해주세요"
            aria-invalid={isModelNameInvalid}
            aria-describedby={modelNameErrorMessage ? 'model-name-error' : undefined}
          />

          {modelNameErrorMessage && (
            <p id="model-name-error" className="audit-execution-section__field-error">
              {modelNameErrorMessage}
            </p>
          )}

          {willReuseModel && selectedPreviousModel ? (
            <div className="audit-execution-section__reuse-panel">
              <div className="audit-execution-section__reuse-header">
                <span className="audit-execution-section__reuse-label">이전 모델 파일 재사용</span>
                <button
                  type="button"
                  className="audit-execution-section__reuse-switch"
                  onClick={() => setUseNewModelUpload(true)}
                >
                  새 모델 파일 업로드
                </button>
              </div>
              <p className="audit-execution-section__reuse-meta">
                {selectedPreviousModel.originalFileName ?? '파일명 정보 없음'}
              </p>
            </div>
          ) : (
            <>
              {isUpdateMode && selectedPreviousModel && (
                <button
                  type="button"
                  className="audit-execution-section__reuse-switch audit-execution-section__reuse-switch--back"
                  onClick={() => {
                    setUseNewModelUpload(false);
                    setModelFile(null);
                  }}
                >
                  ← 이전 모델 파일 재사용으로 돌아가기
                </button>
              )}

              <div
                className="audit-execution-section__dropzone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleModelDrop}
              >
                <span className="audit-execution-section__dropzone-text">
                  {modelFile ? modelFile.name : '모델 파일 업로드'}
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
            </>
          )}
        </div>

        <div className="audit-execution-section__upload-card">
          <h2 className="audit-execution-section__upload-title audit-execution-section__upload-title--standalone">
            ② 감사 데이터 + 민감변수 지정
          </h2>

          {willReuseDataset && reusedDataset ? (
            <div className="audit-execution-section__reuse-panel">
              <div className="audit-execution-section__reuse-header">
                <span className="audit-execution-section__reuse-label">이전 데이터셋 재사용</span>
                <button
                  type="button"
                  className="audit-execution-section__reuse-switch"
                  onClick={() => setUseNewDatasetUpload(true)}
                >
                  새 데이터셋 업로드
                </button>
              </div>
              <p className="audit-execution-section__reuse-meta">
                {formatUploadedAt(reusedDataset.createdAt)} 업로드 · 컬럼 {reusedDataset.columns.length}개
              </p>

              <p className="audit-execution-section__field-label">
                민감변수 컬럼
                <span className="audit-execution-section__field-label-count">
                  {reusedDataset.sensitiveAttributes.length}개
                </span>
              </p>
              <div className="audit-execution-section__tag-list">
                {reusedDataset.sensitiveAttributes.map((column) => (
                  <span
                    key={column}
                    className="audit-execution-section__tag audit-execution-section__tag--selected audit-execution-section__tag--readonly"
                  >
                    {column}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <>
              {isUpdateMode && reusedDataset && (
                <button
                  type="button"
                  className="audit-execution-section__reuse-switch audit-execution-section__reuse-switch--back"
                  onClick={() => {
                    setUseNewDatasetUpload(false);
                    setAuditDatasetFile(null);
                    setAvailableColumns([]);
                    setSensitiveColumns(new Set());
                  }}
                >
                  ← 이전 데이터셋 재사용으로 돌아가기
                </button>
              )}

              {isUpdateMode && isLoadingReusedDataset && (
                <p className="audit-execution-section__hint">이전 데이터셋을 확인하는 중…</p>
              )}

              <div
                className="audit-execution-section__dropzone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleAuditDatasetDrop}
              >
                <span className="audit-execution-section__dropzone-text">
                  {auditDatasetFile ? auditDatasetFile.name : '감사 데이터 파일 업로드'}
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
                  <SensitiveColumnPicker
                    availableColumns={availableColumns}
                    selectedColumns={sensitiveColumns}
                    onAdd={handleAddSensitiveColumn}
                  />
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
            </>
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
          disabled={isStartDisabled}
          onClick={handleStartAudit}
        >
          감사 시작
        </button>
      </div>
        </>
      )}

      {submitError && (
        <p className="audit-execution-section__empty" role="alert">
          {submitError}
        </p>
      )}

      {modelNameToastMessage && (
        // key로 메시지 자체를 써서, 새로운 오류가 뜰 때마다(중복 → 길이초과 등) 페이드인 애니메이션이
        // 다시 재생되게 한다. 오류가 해소되면 이 블록 자체가 사라지므로 토스트가 곧바로 함께 사라진다
        // (별도 타이머 상태 없이 검증 결과 하나로 항상 동기화된다).
        <div
          key={modelNameToastMessage}
          className="audit-execution-section__duplicate-toast"
          role="alert"
        >
          {modelNameToastMessage}
        </div>
      )}
    </div>
  );
}

export default AuditExecutionSection;