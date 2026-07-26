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

export async function uploadModel(
  file: File,
  modelName: string,
  modelType: ModelType,
): Promise<ModelUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('modelName', modelName);
  formData.append('modelType', modelType);

  const { data } = await apiClient.post<ModelUploadResponse>(
    createModelsUrl(''),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

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