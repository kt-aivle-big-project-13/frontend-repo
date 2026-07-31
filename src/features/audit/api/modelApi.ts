import { apiClient } from '../../../shared/api/client';

// 백엔드 모델/데이터셋 엔드포인트는 /api/models 로 /v1 이 붙지 않는다 (audits 와 다름).
const modelsBaseUrl = import.meta.env.VITE_API_BASE_URL.replace(
  /\/v1\/?$/,
  '',
);

function createModelsUrl(path: string): string {
  return `${modelsBaseUrl}/models${path}`;
}

export type ModelType = 'XGBOOST' | 'LOGISTIC' | 'LIGHTGBM';
export type DatasetPurpose = 'AUDIT' | 'VALIDATION';

export interface ModelUploadResponse {
  modelId: number;
  modelName: string;
  version: string;
  fileName: string;
  uploadedAt: string;
}

export interface ModelUploadOptions {
  // 기존 모델의 새 버전으로 등록할 때만 지정한다 — 지정하면 그 모델의 계열(modelGroupId)을 이어받는다.
  version?: string;
  previousModelId?: number;
}

// file을 생략하면(버전업 시 이전 모델 파일 재사용) previousModelId가 반드시 있어야 하고,
// 백엔드가 그 모델의 아티팩트를 그대로 새 버전에 이어붙인다.
export async function uploadModel(
  file: File | null,
  modelName: string,
  modelType: ModelType,
  options?: ModelUploadOptions,
): Promise<ModelUploadResponse> {
  const formData = new FormData();
  if (file) formData.append('file', file);
  formData.append('modelName', modelName);
  formData.append('modelType', modelType);
  if (options?.version) formData.append('version', options.version);
  if (options?.previousModelId != null) {
    formData.append('previousModelId', String(options.previousModelId));
  }

  const { data } = await apiClient.post<ModelUploadResponse>(
    createModelsUrl(''),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return data;
}

export interface ModelSummaryResponse {
  modelId: number;
  modelName: string;
  currentVersion: string;
  modelType: ModelType;
  originalFileName: string | null;
  highImpact: boolean | null;
  uploadedAt: string;
}

// 계열(modelGroupId)당 최신 버전 하나만 돌려준다 — 버전업 시 "이전 모델" 선택 목록으로 쓴다.
export async function getModels(): Promise<ModelSummaryResponse[]> {
  const { data } = await apiClient.get<ModelSummaryResponse[]>(createModelsUrl(''));
  return data;
}

export interface DatasetUploadResponse {
  datasetId: number;
  modelId: number;
  dataSource: string;
  purpose: DatasetPurpose;
  rowCount: number;
  columns: string[];
}

export async function uploadDataset(
  modelId: number,
  file: File,
  purpose: DatasetPurpose,
): Promise<DatasetUploadResponse> {
  const formData = new FormData();
  formData.append('datasetFile', file);
  formData.append('purpose', purpose);

  const { data } = await apiClient.post<DatasetUploadResponse>(
    createModelsUrl(`/${modelId}/datasets`),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return data;
}

export interface DatasetSummaryResponse {
  datasetId: number;
  modelId: number;
  modelVersion: string;
  purpose: string;
  columns: string[];
  audited: boolean;
  createdAt: string;
  sensitiveAttributes: string[];
}

// 모델이 속한 계열(같은 modelGroupId) 전체의 데이터셋 목록 — 버전업 시 이전 버전이 쓰던
// 데이터셋을 재사용 후보로 보여줄 때 쓴다. 최신순으로 내려온다.
export async function getModelDatasets(
  modelId: number,
  purpose?: DatasetPurpose,
): Promise<DatasetSummaryResponse[]> {
  const { data } = await apiClient.get<DatasetSummaryResponse[]>(
    createModelsUrl(`/${modelId}/datasets`),
    { params: purpose ? { purpose } : undefined },
  );

  return data;
}

export interface SensitiveAttributesResponse {
  datasetId: number;
  sensitiveAttributes: string[];
}

export async function updateSensitiveAttributes(
  modelId: number,
  datasetId: number,
  sensitiveAttributes: string[],
): Promise<SensitiveAttributesResponse> {
  const { data } = await apiClient.patch<SensitiveAttributesResponse>(
    createModelsUrl(`/${modelId}/datasets/${datasetId}/sensitive-attributes`),
    { sensitiveAttributes },
  );

  return data;
}