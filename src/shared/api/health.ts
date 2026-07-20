import { apiClient } from './client';

export interface HealthResponse {
  status: string;
  id: number;
  checkedAt: string;
}

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health');
  return data;
}