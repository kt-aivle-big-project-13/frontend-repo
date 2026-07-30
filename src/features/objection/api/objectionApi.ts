import { apiClient } from '../../../shared/api/client';

export type ReviewResult = 'APPROVED' | 'REJECTED';
export type LetterTone = 'FORMAL' | 'PLAIN';
export type DispatchChannel = 'SMS' | 'EMAIL';
export type ContributorDirection = 'POSITIVE' | 'NEGATIVE';

export type CustomerFeatureValue =
  | string
  | number
  | boolean
  | null;

export interface CreateObjectionRequest {
  auditId: number;
  customerCaseNo: string;
  reviewResult: ReviewResult;
  reviewBasis: string;
  customerFeatures?: Record<string, CustomerFeatureValue>;
}

export interface CreateObjectionResponse {
  objectionId: number;
  auditId: number;
  customerCaseNo: string;
  status: 'DRAFTING';
}

export interface TopContributor {
  feature: string;
  value: CustomerFeatureValue;
  shapValue: number;
  direction: ContributorDirection;
}

export interface GenerateExplanationResponse {
  objectionId: number;
  topContributors: TopContributor[];
  rules: string[];
  explanation: string;
}

export interface GenerateLetterRequest {
  tone?: LetterTone;
  additionalNote?: string;
}

export interface GenerateLetterResponse {
  objectionId: number;
  letterId: number;
  title: string;
  body: string;
  status: 'DRAFT';
  generatedAt: string;
}

export interface DispatchObjectionRequest {
  approved: boolean;
  channels: DispatchChannel[];
  recipientContact: string;
}

export interface DispatchObjectionResponse {
  objectionId: number;
  status: 'DISPATCHED';
  channels: DispatchChannel[];
  dispatchedAt: string;
}

/**
 * 이의제기 건 등록
 * POST /objections
 */
export async function createObjection(
  request: CreateObjectionRequest,
): Promise<CreateObjectionResponse> {
  const { data } =
    await apiClient.post<CreateObjectionResponse>(
      '/objections',
      request,
    );

  return data;
}

/**
 * 판단 근거 설명 생성
 * POST /objections/{objectionId}/explanation
 */
export async function generateObjectionExplanation(
  objectionId: number,
): Promise<GenerateExplanationResponse> {
  const { data } =
    await apiClient.post<GenerateExplanationResponse>(
      `/objections/${objectionId}/explanation`,
    );

  return data;
}

/**
 * 고객 안내문 초안 생성
 * POST /objections/{objectionId}/letter
 */
export async function generateObjectionLetter(
  objectionId: number,
  request: GenerateLetterRequest = {
    tone: 'FORMAL',
  },
): Promise<GenerateLetterResponse> {
  const { data } =
    await apiClient.post<GenerateLetterResponse>(
      `/objections/${objectionId}/letter`,
      request,
    );

  return data;
}

/**
 * 담당자 승인 및 문서 발송
 * POST /objections/{objectionId}/dispatch
 */
export async function dispatchObjection(
  objectionId: number,
  request: DispatchObjectionRequest,
): Promise<DispatchObjectionResponse> {
  const { data } =
    await apiClient.post<DispatchObjectionResponse>(
      `/objections/${objectionId}/dispatch`,
      request,
    );

  return data;
}