import axios from 'axios';

import { apiClient } from '../../../shared/api/client';

import type {
  ObjectionCompletionInfo,
  ObjectionContributor,
  ObjectionDetail,
  ObjectionDispatchHistory,
  ObjectionDocument,
  ObjectionImportResult,
  ObjectionReviewResult,
  ObjectionSummary,
} from '../model/objectionTypes';

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

type ObjectionDecisionDto = 'REJECT_MAINTAIN' | 'REEXAMINATION';

// 백엔드 이의제기 요약 응답
interface ObjectionSummaryDto {
  objectionId: number;
  objectionNo: string;
  customerName: string;
  title: string;
  caseType: string;
  highImpactAi: boolean;
  status: 'WAITING' | 'COMPLETED';
  submittedAt: string;
}

// 백엔드 이의제기 상세 응답
interface ObjectionDetailDto extends ObjectionSummaryDto {
  content: string;
  modelId: number | null;
  modelName: string | null;
  shapEvidence: string | null;
  staffNote: string | null;
  decision: ObjectionDecisionDto | null;
  draftContent: string | null;
  approvedAt: string | null;
  deliveredAt: string | null;
  approverName: string | null;
  recipientEmail: string | null;
}

// 백엔드 대응문서 응답
interface ObjectionDocumentDto {
  objectionId: number;
  objectionNo: string;
  customerName: string;
  decision: ObjectionDecisionDto;
  explanation: string;
  letterTitle: string;
  letterBody: string;
}

// 백엔드가 GlobalExceptionHandler로 내려주는 에러 응답 형태
interface ApiErrorResponse {
  message?: string;
}

// axios 에러에서 백엔드가 내려준 실제 에러 메시지를 꺼낸다.
export function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error) && error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

// 백엔드 ObjectionDecision <-> 프론트 ObjectionReviewResult 매핑
function toReviewResult(decision: ObjectionDecisionDto): ObjectionReviewResult {
  return decision === 'REEXAMINATION' ? 'RE_REVIEW' : 'REJECTED';
}

function toDecision(reviewResult: ObjectionReviewResult): ObjectionDecisionDto {
  return reviewResult === 'RE_REVIEW' ? 'REEXAMINATION' : 'REJECT_MAINTAIN';
}

type ContributorLevelInternal = ObjectionContributor['level'];

// "부채비율 82%; 신용점수 812점" 같은 CSV 원문을 화면에 표시할 판단 근거 칩으로 변환
function parseContributors(shapEvidence: string | null): ObjectionContributor[] {
  if (!shapEvidence) {
    return [];
  }

  const levels: ContributorLevelInternal[] = ['HIGH', 'MEDIUM', 'LOW'];

  return shapEvidence
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, index) => {
      const lastSpaceIndex = part.lastIndexOf(' ');
      const label = lastSpaceIndex === -1 ? part : part.slice(0, lastSpaceIndex);
      const value = lastSpaceIndex === -1 ? '-' : part.slice(lastSpaceIndex + 1);

      return {
        feature: `shap-${index}`,
        label: label || part,
        value,
        level: levels[Math.min(index, levels.length - 1)],
      };
    });
}

function toSummary(dto: ObjectionSummaryDto): ObjectionSummary {
  return {
    objectionId: dto.objectionId,
    objectionNo: dto.objectionNo,
    customerName: dto.customerName,
    title: dto.title,
    caseType: dto.caseType,
    highImpactAi: dto.highImpactAi,
    status: dto.status,
    createdAt: dto.submittedAt,
  };
}

function toCompletionInfo(dto: ObjectionDetailDto): ObjectionCompletionInfo | undefined {
  if (dto.status !== 'COMPLETED' || !dto.decision || !dto.deliveredAt) {
    return undefined;
  }

  return {
    reviewResult: toReviewResult(dto.decision),
    dispatchedAt: dto.deliveredAt,
    recipientEmail: dto.recipientEmail ?? '',
  };
}

function toDetail(dto: ObjectionDetailDto): ObjectionDetail {
  return {
    ...toSummary(dto),
    content: dto.content,
    contributors: parseContributors(dto.shapEvidence),
    reviewBasis: dto.staffNote ?? '',
    completionInfo: toCompletionInfo(dto),
  };
}

// 이의제기 목록 조회
export async function fetchObjections(): Promise<ObjectionSummary[]> {
  const { data } = await apiClient.get<PageResponse<ObjectionSummaryDto>>(
    '/objections',
    { params: { page: 1, size: 100, sort: 'latest' } },
  );

  return data.content.map(toSummary);
}

// 특정 이의제기 상세 조회
export async function fetchObjectionDetail(
  objectionId: number,
): Promise<ObjectionDetail> {
  const { data } = await apiClient.get<ObjectionDetailDto>(
    `/objections/${objectionId}`,
  );

  return toDetail(data);
}

// 이의제기 신용감사 결과 CSV 업로드 (다건 일괄 등록)
export async function importObjectionsCsv(
  file: File,
): Promise<ObjectionImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<{
    importedCount: number;
    objections: ObjectionSummaryDto[];
  }>('/objections/import', formData);

  return {
    importedCount: data.importedCount,
    objections: data.objections.map(toSummary),
  };
}

// 처리 결과에 따라 대응문서(판단 근거 설명 + 고객 안내문 초안) 조회
export async function fetchObjectionDocument(
  objectionId: number,
  reviewResult: ObjectionReviewResult = 'REJECTED',
): Promise<ObjectionDocument> {
  const { data } = await apiClient.get<ObjectionDocumentDto>(
    `/objections/${objectionId}/document`,
    { params: { decision: toDecision(reviewResult) } },
  );

  return {
    objectionId: data.objectionId,
    objectionNo: data.objectionNo,
    customerName: data.customerName,
    reviewResult: toReviewResult(data.decision),
    explanation: data.explanation,
    letterTitle: data.letterTitle,
    letterBody: data.letterBody,
  };
}

// 고객 안내문 재생성
export async function regenerateObjectionLetter(
  objectionId: number,
  reviewResult: ObjectionReviewResult,
): Promise<string> {
  const { data } = await apiClient.post<{ letterBody: string }>(
    `/objections/${objectionId}/document/regenerate`,
    null,
    { params: { decision: toDecision(reviewResult) } },
  );

  return data.letterBody;
}

// 특정 이의제기의 고객 안내문 발송 이력 조회
export async function fetchDispatchHistory(
  objectionId: number,
): Promise<ObjectionDispatchHistory[]> {
  const objection = await fetchObjectionDetail(objectionId);

  if (!objection.completionInfo) {
    return [];
  }

  return [
    {
      dispatchId: objection.objectionId,
      objectionId: objection.objectionId,
      customerName: objection.customerName,
      objectionNo: objection.objectionNo,
      dispatchedAt: objection.completionInfo.dispatchedAt,
      reviewResult: objection.completionInfo.reviewResult,
      status: 'DISPATCHED',
    },
  ];
}

// 고객 안내문 발송 요청 정보
export interface DispatchDocumentRequest {
  objectionId: number;
  reviewResult: ObjectionReviewResult;
  letterTitle: string;
  letterBody: string;
  recipientEmail: string;
}

// 이의제기 처리 확정 및 고객 안내문 발송
export async function dispatchObjectionDocument(
  request: DispatchDocumentRequest,
): Promise<ObjectionDispatchHistory> {
  const { data } = await apiClient.post<ObjectionDetailDto>(
    `/objections/${request.objectionId}/dispatch`,
    {
      decision: toDecision(request.reviewResult),
      letterTitle: request.letterTitle,
      letterBody: request.letterBody,
      recipientEmail: request.recipientEmail,
    },
  );

  const detail = toDetail(data);

  if (!detail.completionInfo) {
    throw new Error('발송 처리에 실패했습니다.');
  }

  return {
    dispatchId: detail.objectionId,
    objectionId: detail.objectionId,
    customerName: detail.customerName,
    objectionNo: detail.objectionNo,
    dispatchedAt: detail.completionInfo.dispatchedAt,
    reviewResult: detail.completionInfo.reviewResult,
    status: 'DISPATCHED',
  };
}