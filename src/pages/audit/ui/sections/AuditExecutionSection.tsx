import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';

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

function AuditExecutionSection() {
  const navigate = useNavigate();

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

  const selectedPreviousModel = useMemo(
    () => previousModels.find((model) => model.modelId === selectedPreviousModelId) ?? null,
    [previousModels, selectedPreviousModelId],
  );

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

  const handleSelectPreviousModel = (event: ChangeEvent<HTMLSelectElement>) => {
    const modelId = Number(event.target.value);
    const model = previousModels.find((item) => item.modelId === modelId);
    if (!model) return;

    setSelectedPreviousModelId(modelId);
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
    getModelDatasets(modelId, 'AUDIT')
      .then((datasets) => {
        const latest = datasets[0] ?? null;
        setReusedDataset(latest);
        if (!latest) setUseNewDatasetUpload(true);
      })
      .catch(() => {
        setReusedDataset(null);
        setUseNewDatasetUpload(true);
      })
      .finally(() => setIsLoadingReusedDataset(false));
  };

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

    try {
      const fallbackModelName = modelFile?.name ?? selectedPreviousModel?.modelName ?? '';

      const model = await uploadModel(
        willReuseModel ? null : modelFile,
        modelName || fallbackModelName,
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

      const auditName = modelName || fallbackModelName;

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
          datasetId,
          auditName,
          thresholdMethod: 'VALIDATION_DATASET',
          validationDatasetId: validationDataset.datasetId,
        });
      } else {
        started = await startAudit({
          modelId: model.modelId,
          datasetId,
          auditName,
          thresholdMethod: 'MANUAL',
          manualThreshold: 0.5,
        });
      }

      // 실제 SHAP/Fairlearn 분석은 오래 걸릴 수 있어, 여기서 기다리는 대신
      // STEP3(체크리스트 작성) 페이지로 바로 이동해 분석 진행 상황을 보여주면서
      // 자가점검 체크리스트를 함께 작성할 수 있게 한다.
      navigate(`/audit/${started.auditId}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : '감사 시작 중 오류가 발생했습니다.',
      );
      setIsSubmitting(false);
    }
  };

  const isStartDisabled =
    (!willReuseModel && !modelFile) ||
    isSubmitting ||
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
            className="audit-execution-section__text-input"
            value={modelName}
            onChange={(event) => setModelName(event.target.value)}
            placeholder="모델명을 입력해주세요"
          />

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
          {isUpdateMode ? '버전업 감사' : '감사 시작'}
        </button>
      </div>
        </>
      )}

      {submitError && (
        <p className="audit-execution-section__empty" role="alert">
          {submitError}
        </p>
      )}
    </div>
  );
}

export default AuditExecutionSection;
