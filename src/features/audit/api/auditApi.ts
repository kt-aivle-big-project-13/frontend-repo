import { apiClient } from '../../../shared/api/client';

export type ThresholdMethod = 'VALIDATION_DATASET' | 'MANUAL';

export type AuditStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLIANT'
  | 'WARNING'
  | 'NON_COMPLIANT'
  | 'UNCONFIRMED'
  | 'FAILED';

export const TERMINAL_STATUSES: AuditStatus[] = [
  'COMPLIANT',
  'WARNING',
  'NON_COMPLIANT',
  'UNCONFIRMED',
  'FAILED',
];

export interface StartAuditRequest {
  modelId: number;
  datasetId: number;
  auditName: string;
  thresholdMethod: ThresholdMethod;
  manualThreshold?: number;
  targetApprovalRate?: number;
  validationDatasetId?: number;
}

export interface StartAuditResponse {
  auditId: number;
  status: string;
  startedAt: string;
}

export async function startAudit(
  request: StartAuditRequest,
): Promise<StartAuditResponse> {
  const { data } = await apiClient.post<StartAuditResponse>(
    '/audits',
    request,
  );

  return data;
}

export interface AuditSummary {
  auditId: number;
  modelName: string;
  completedAt: string | null;
  status: AuditStatus;
  currentStep: number;
}

export async function getAudits(): Promise<AuditSummary[]> {
  const { data } = await apiClient.get<AuditSummary[]>('/audits');
  return data;
}

// 감사 실행은 202 Accepted 로 비동기 시작되므로, 최종 상태가 될 때까지 목록을 짧은 간격으로 다시 조회한다.
export async function waitForAuditCompletion(
  auditId: number,
  { intervalMs = 2000, timeoutMs = 300000 } = {},
): Promise<AuditSummary> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const audits = await getAudits();
    const audit = audits.find((item) => item.auditId === auditId);

    if (audit && TERMINAL_STATUSES.includes(audit.status)) {
      return audit;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('감사 분석이 제한 시간 내에 끝나지 않았습니다.');
}

export type FairlearnMetricCode =
  | 'DEMOGRAPHIC_PARITY'
  | 'EQUAL_OPPORTUNITY'
  | 'EQUALIZED_ODDS'
  | 'PROPORTIONAL_PARITY'
  | 'FPR_PARITY'
  | 'FDR_PARITY'
  | 'FOR_PARITY';
export type FairlearnStatus = 'PASS' | 'REVIEW' | 'FAIL';

export interface FairlearnResultItem {
  attribute: string;
  metricCode: FairlearnMetricCode;
  value: number;
  threshold: number;
  status: FairlearnStatus;
  note: string | null;
}

export interface FairnessResponse {
  auditId: number;
  method: string;
  results: FairlearnResultItem[];
}

export async function getFairness(
  auditId: number,
): Promise<FairnessResponse> {
  const { data } = await apiClient.get<FairnessResponse>(
    `/audits/${auditId}/fairness`,
  );

  return data;
}

export type ShapMetricCode =
  | 'SENSITIVE_CONTRIB'
  | 'GLOBAL_STABILITY'
  | 'FIDELITY';
export type ShapStatus = 'PASS' | 'WARNING' | 'REVIEW';

export interface ShapMetricItem {
  metricCode: ShapMetricCode;
  value: number;
  threshold: number;
  status: ShapStatus;
}

export interface ExplainabilityResponse {
  auditId: number;
  method: string;
  metrics: ShapMetricItem[];
}

export async function getExplainability(
  auditId: number,
): Promise<ExplainabilityResponse> {
  const { data } = await apiClient.get<ExplainabilityResponse>(
    `/audits/${auditId}/explainability`,
  );

  return data;
}

export type SelfCheckItemCode =
  | 'NOTICE'
  | 'OBJECTION'
  | 'OVERSIGHT'
  | 'RISK_MANAGEMENT'
  | 'DOCUMENTATION';

export interface SelfCheckAnswerItem {
  itemCode: SelfCheckItemCode;
  label: string;
  answer: boolean;
}

export interface SelfCheckAnswerResponse {
  auditId: number;
  answers: SelfCheckAnswerItem[];
}

export async function saveSelfCheckAnswers(
  auditId: number,
  answers: { itemCode: SelfCheckItemCode; answer: boolean }[],
): Promise<SelfCheckAnswerResponse> {
  const { data } = await apiClient.post<SelfCheckAnswerResponse>(
    `/audits/${auditId}/self-check-answers`,
    { answers },
  );

  return data;
}

export async function getSelfCheckAnswers(
  auditId: number,
): Promise<SelfCheckAnswerResponse> {
  const { data } = await apiClient.get<SelfCheckAnswerResponse>(
    `/audits/${auditId}/self-check-answers`,
  );

  return data;
}

export type RegulationComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT';

export interface RegulationMappingItem {
  mappingId: number;
  regulation: string;
  article: string;
  content: string;
  compliance: RegulationComplianceStatus;
  evidence: string;
}

export interface RegulationMappingResponse {
  auditId: number;
  mappings: RegulationMappingItem[];
}

export async function getRegulationMappings(
  auditId: number,
): Promise<RegulationMappingResponse> {
  const { data } = await apiClient.get<RegulationMappingResponse>(
    `/audits/${auditId}/regulation-mappings`,
  );

  return data;
}

// 자율점검 제출 커밋 후 백엔드가 비동기로 법조문 매핑을 생성하므로, 매핑이 아직
// 비어있으면 완료될 때까지 짧게 폴링한다.
export async function waitForRegulationMappings(
  auditId: number,
  { intervalMs = 1500, timeoutMs = 15000 } = {},
): Promise<RegulationMappingItem[]> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const { mappings } = await getRegulationMappings(auditId);
    if (mappings.length > 0) return mappings;

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return [];
}