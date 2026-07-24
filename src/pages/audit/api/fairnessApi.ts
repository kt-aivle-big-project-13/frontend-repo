import { apiClient } from '../../../shared/api/client';

export type FairlearnMetricCode =
  | 'DEMOGRAPHIC_PARITY'
  | 'EQUAL_OPPORTUNITY'
  | 'EQUALIZED_ODDS';

export type FairlearnStatus = 'PASS' | 'REVIEW' | 'FAIL';

export interface FairlearnResultItem {
  attribute: string;
  metricCode: FairlearnMetricCode;
  value: number;
  threshold: number;
  status: FairlearnStatus;
}

export interface FairnessResultResponse {
  auditId: number;
  method: string;
  results: FairlearnResultItem[];
}

// 감사별 Fairlearn 공정성 결과 조회 (Authorization 헤더는 apiClient interceptor 가 주입)
export async function getFairnessResult(
  auditId: number,
): Promise<FairnessResultResponse> {
  const { data } = await apiClient.get<FairnessResultResponse>(
    `/audits/${auditId}/fairness`,
  );

  return data;
}
