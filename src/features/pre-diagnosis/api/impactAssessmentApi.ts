import { apiClient } from '../../../shared/api/client';

const impactAssessmentBaseUrl = import.meta.env.VITE_API_BASE_URL.replace(
  /\/v1\/?$/,
  '',
);

function createImpactAssessmentUrl(path: string): string {
  return `${impactAssessmentBaseUrl}/impact-assessments${path}`;
}

export type AssessmentResult =
  | 'IN_PROGRESS'
  | 'NEEDS_QUANTITATIVE'
  | 'HIGH_IMPACT'
  | 'NOT_APPLICABLE';

export interface AssessmentResponse {
  assessmentId: number;
  modelId: number | null;
  conditionMet: boolean;
  groupAScore: number;
  groupBScore: number;
  totalScore: number;
  result: AssessmentResult;
}

export interface AssessmentAnswer {
  questionCode: string;
  answer: boolean;
}

export interface AssessmentAnswersRequest {
  answers: AssessmentAnswer[];
}

export async function startImpactAssessment(): Promise<AssessmentResponse> {
  const { data } = await apiClient.post<AssessmentResponse>(
    createImpactAssessmentUrl(''),
  );

  return data;
}

export async function submitImpactAssessmentStage1(
  assessmentId: number,
  answers: AssessmentAnswer[],
): Promise<AssessmentResponse> {
  const { data } = await apiClient.post<
    AssessmentResponse,
    { data: AssessmentResponse },
    AssessmentAnswersRequest
  >(createImpactAssessmentUrl(`/${assessmentId}/stage1`), { answers });

  return data;
}

export async function submitImpactAssessmentStage2(
  assessmentId: number,
  answers: AssessmentAnswer[],
): Promise<AssessmentResponse> {
  const { data } = await apiClient.post<
    AssessmentResponse,
    { data: AssessmentResponse },
    AssessmentAnswersRequest
  >(createImpactAssessmentUrl(`/${assessmentId}/stage2`), { answers });

  return data;
}

export async function getImpactAssessmentResult(
  assessmentId: number,
): Promise<AssessmentResponse> {
  const { data } = await apiClient.get<AssessmentResponse>(
    createImpactAssessmentUrl(`/${assessmentId}`),
  );

  return data;
}
