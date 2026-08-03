import { apiClient } from '../../../shared/api/client';

export type DashboardAuditStatus = 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';

export type FairnessMetricCode =
  | 'DEMOGRAPHIC_PARITY'
  | 'EQUAL_OPPORTUNITY'
  | 'EQUALIZED_ODDS'
  | 'PROPORTIONAL_PARITY'
  | 'FPR_PARITY'
  | 'FDR_PARITY'
  | 'FOR_PARITY';

export interface DashboardSummary {
  analyzedModelCount: number;
  normalModelCount: number;
  reviewRequiredCount: number;
  thresholdExceededCount: number;
  complianceRate: number;
}

export interface AuditResultDistribution {
  totalCount: number;
  normalCount: number;
  reviewRequiredCount: number;
  thresholdExceededCount: number;
}

export interface ReviewRequiredModel {
  modelId: number;
  modelName: string;
  issueCount: number;
  status: DashboardAuditStatus;
}

export interface FairnessMetricDistribution {
  metricCode: FairnessMetricCode;
  passCount: number;
  reviewCount: number;
  failCount: number;
  unavailableCount: number;
  passRate: number;
  reviewRate: number;
  failRate: number;
  unavailableRate: number;
}

export interface RecentAudit {
  auditId: number;
  modelId: number;
  modelName: string;
  status: DashboardAuditStatus;
  keyRisk: string;
  completedAt: string;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  auditResultDistribution: AuditResultDistribution;
  reviewRequiredTopModels: ReviewRequiredModel[];
  fairnessMetricDistributions: FairnessMetricDistribution[];
  recentAudits: RecentAudit[];
}

export async function getDashboard(): Promise<DashboardResponse> {
  const { data } = await apiClient.get<DashboardResponse>('/dashboard');

  return data;
}
