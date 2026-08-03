import { apiClient } from '../../../shared/api/client';

export type ThresholdMethod = 'VALIDATION_DATASET' | 'MANUAL';

export type AuditStatus =
  'PENDING' | 'IN_PROGRESS' | 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' | 'UNCONFIRMED' | 'FAILED';

export const TERMINAL_STATUSES: AuditStatus[] = [
  'COMPLIANT',
  'WARNING',
  'NON_COMPLIANT',
  'UNCONFIRMED',
  'FAILED',
];

export interface StartAuditRequest {
  assessmentId?: number;
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

export async function startAudit(request: StartAuditRequest): Promise<StartAuditResponse> {
  const { data } = await apiClient.post<StartAuditResponse>('/audits', request);

  return data;
}

export interface AuditSummary {
  auditId: number;
  modelName: string;
  modelFileName: string | null;
  datasetFileName: string | null;
  modelGroupId: string | null;
  version: string | null;
  // 연결된 고영향 AI 사전진단. 사전진단은 건너뛸 수 있어 null 이면 진행하지 않은 감사다.
  assessmentId: number | null;
  createdAt: string;
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

export async function getFairness(auditId: number): Promise<FairnessResponse> {
  const { data } = await apiClient.get<FairnessResponse>(`/audits/${auditId}/fairness`);

  return data;
}

export type ShapMetricCode = 'SENSITIVE_CONTRIB' | 'GLOBAL_STABILITY' | 'FIDELITY';
export type ShapStatus = 'PASS' | 'WARNING' | 'REVIEW';

export interface ShapMetricItem {
  metricCode: ShapMetricCode;
  value: number;
  threshold: number;
  status: ShapStatus;
}

export interface FeatureImportanceItem {
  rank: number;
  feature: string;
  value: number | null;
  isSensitive: boolean;
  sensitiveGroup: string | null;
}

export interface ExplainabilityResponse {
  auditId: number;
  method: string;
  metrics: ShapMetricItem[];
  topFeatures: FeatureImportanceItem[];
}

export async function getExplainability(auditId: number): Promise<ExplainabilityResponse> {
  const { data } = await apiClient.get<ExplainabilityResponse>(`/audits/${auditId}/explainability`);

  return data;
}

export type SelfCheckItemCode =
  'NOTICE' | 'OBJECTION' | 'OVERSIGHT' | 'RISK_MANAGEMENT' | 'DOCUMENTATION';

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

export async function getSelfCheckAnswers(auditId: number): Promise<SelfCheckAnswerResponse> {
  const { data } = await apiClient.get<SelfCheckAnswerResponse>(
    `/audits/${auditId}/self-check-answers`,
  );

  return data;
}

export type RegulationComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT';

// 조항 하나가 여러 자가점검 문항에, 문항마다 다른 항으로 걸릴 수 있어(예: 제34조는 위험관리
// 문항엔 "①1호", 관리감독 문항엔 "①4호") 문항·항을 쌍으로 묶어서 받는다.
// note는 그 문항·항이 왜 매칭됐는지에 대한 화면 표시용 요약 문구다(조 전체 요약인 summary와 달리
// 항 단위로 정확하다).
export interface MatchedChecklistItem {
  itemCode: SelfCheckItemCode;
  clauseNo: string | null;
  note: string;
}

export interface RegulationMappingItem {
  mappingId: number;
  regulation: string;
  article: string;
  content: string;
  summary: string;
  compliance: RegulationComplianceStatus;
  evidence: string;
  matchedItems: MatchedChecklistItem[];
}

export interface RegulationMappingResponse {
  auditId: number;
  mappings: RegulationMappingItem[];
}

export async function getRegulationMappings(auditId: number): Promise<RegulationMappingResponse> {
  const { data } = await apiClient.get<RegulationMappingResponse>(
    `/audits/${auditId}/regulation-mappings`,
  );

  return data;
}

// 폴링이 제한 시간 안에 매핑을 못 받아온 경우. 실제로 매핑이 없는 것(빈 배열)과 구분해야
// 화면에서 "매칭된 조항이 없습니다"로 잘못 단정하지 않고 재조회를 유도할 수 있다.
export class RegulationMappingTimeoutError extends Error {
  constructor() {
    super('규제 매핑 조회가 제한 시간 내에 끝나지 않았습니다.');
    this.name = 'RegulationMappingTimeoutError';
  }
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

  throw new RegulationMappingTimeoutError();
}
