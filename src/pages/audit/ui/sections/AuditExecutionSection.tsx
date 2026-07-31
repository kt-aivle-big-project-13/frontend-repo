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
  type ModelType,
} from '../../../../features/audit/api/modelApi';
import { startAudit } from '../../../../features/audit/api/auditApi';
import StepIndicator from '../StepIndicator';

import './AuditFlow.css';

type ModelMode = 'new' | 'update';

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

  const handleStartAudit = async () => {
    if (!modelFile || !auditDatasetFile || isSubmitting) return;
    if (useValidationDataset && !validationDatasetFile) return;

    const modelType = resolveModelType(modelFile);
    if (!modelType) {
      setSubmitError(
        '.pkl/.joblib 모델은 아직 모델 타입을 자동으로 판단할 수 없습니다. .json(XGBoost) 파일로 업로드해주세요.',
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

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
            isSubmitting ||
            (useValidationDataset && !validationDatasetFile)
          }
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
    </div>
  );
}

export default AuditExecutionSection;