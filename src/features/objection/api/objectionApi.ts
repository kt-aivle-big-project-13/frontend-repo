import {
  objectionDispatchHistoryMockData,
  objectionDocumentMockData,
  objectionMockData,
} from '../model/objectionMockData';

import type {
  ObjectionDetail,
  ObjectionDispatchHistory,
  ObjectionDocument,
  ObjectionReviewResult,
} from '../model/objectionTypes';

// 목업 API 응답 지연 시간
const MOCK_DELAY_MS = 250;

// 실제 API 요청처럼 응답을 지연시키는 함수
function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), MOCK_DELAY_MS);
  });
}

// 전체 이의제기 목록 조회
export async function fetchObjections(): Promise<ObjectionDetail[]> {
  return delay(
    objectionMockData.map((item) => ({
      ...item,
      contributors: item.contributors.map((contributor) => ({
        ...contributor,
      })),
      completionInfo: item.completionInfo
        ? {
            ...item.completionInfo,
          }
        : undefined,
    })),
  );
}

// 특정 이의제기 상세 조회
export async function fetchObjectionDetail(
  objectionId: number,
): Promise<ObjectionDetail> {
  const objection = objectionMockData.find(
    (item) => item.objectionId === objectionId,
  );

  if (!objection) {
    throw new Error('해당 이의제기 정보를 찾을 수 없습니다.');
  }

  return delay({
    ...objection,
    contributors: objection.contributors.map((contributor) => ({
      ...contributor,
    })),
    completionInfo: objection.completionInfo
      ? {
          ...objection.completionInfo,
        }
      : undefined,
  });
}

// 처리 결과에 따라 기본 대응문서 생성
function createDefaultDocument(
  objection: ObjectionDetail,
  reviewResult: ObjectionReviewResult,
): ObjectionDocument {
  const isReReview = reviewResult === 'RE_REVIEW';

  return {
    objectionId: objection.objectionId,
    objectionNo: objection.objectionNo,
    customerName: objection.customerName,
    reviewResult,
    explanation:
      objection.reviewBasis ||
      '연계된 분석 결과를 기반으로 판단 근거 설명이 생성됩니다.',
    letterTitle: isReReview
      ? '신용평가 재심사 안내'
      : '신용평가 결과 이의제기 회신 안내',
    letterBody: isReReview
      ? '안녕하세요, 고객님. 접수하신 이의제기 내용을 검토한 결과 추가 자료를 바탕으로 재심사를 진행할 예정입니다.'
      : `안녕하세요, 고객님. 신청하신 심사 결과를 안내드립니다.\n\n${objection.reviewBasis}\n\n관련하여 궁금하신 사항은 이의제기 화면을 통해 다시 문의해주시면 담당자가 성실히 답변드리겠습니다. 감사합니다.`,
  };
}

// 특정 이의제기의 대응문서 조회
export async function fetchObjectionDocument(
  objectionId: number,
  reviewResult: ObjectionReviewResult = 'REJECTED',
): Promise<ObjectionDocument> {
  const savedDocument = objectionDocumentMockData[objectionId];

  if (savedDocument) {
    return delay({
      ...savedDocument,
      reviewResult,
    });
  }

  const objection = objectionMockData.find(
    (item) => item.objectionId === objectionId,
  );

  if (!objection) {
    throw new Error(
      '대응문서를 생성할 이의제기를 찾을 수 없습니다.',
    );
  }

  return delay(createDefaultDocument(objection, reviewResult));
}

// 고객 안내문 재생성
export async function regenerateObjectionLetter(
  objectionId: number,
  reviewResult: ObjectionReviewResult,
): Promise<string> {
  const objection = objectionMockData.find(
    (item) => item.objectionId === objectionId,
  );

  if (!objection) {
    throw new Error('고객 안내문을 생성할 수 없습니다.');
  }

  const letter =
    reviewResult === 'RE_REVIEW'
      ? `안녕하세요, 고객님. 접수하신 이의제기 내용을 다시 검토했습니다.\n\n검토 결과 추가 자료를 바탕으로 재심사를 진행할 예정입니다. 필요한 자료와 후속 절차는 담당자가 별도로 안내드리겠습니다.\n\n감사합니다.`
      : `안녕하세요, 고객님. 접수하신 이의제기 내용을 검토한 결과를 안내드립니다.\n\n${objection.reviewBasis}\n\n위 사유를 종합적으로 검토하여 기존 심사 결과를 유지하기로 결정했습니다. 추가 문의사항은 이의제기 화면을 통해 남겨주시기 바랍니다.\n\n감사합니다.`;

  return delay(letter);
}

// 특정 이의제기의 고객 안내문 발송 이력 조회
export async function fetchDispatchHistory(
  objectionId: number,
): Promise<ObjectionDispatchHistory[]> {
  return delay(
    objectionDispatchHistoryMockData
      .filter((item) => item.objectionId === objectionId)
      .map((item) => ({
        ...item,
      })),
  );
}

// 고객 안내문 발송 요청 정보
export interface DispatchDocumentRequest {
  objectionId: number;
  reviewResult: ObjectionReviewResult;
  letterBody: string;
}

// 고객 안내문 발송
export async function dispatchObjectionDocument(
  request: DispatchDocumentRequest,
): Promise<ObjectionDispatchHistory> {
  if (!request.letterBody.trim()) {
    throw new Error('발송할 고객 안내문이 비어 있습니다.');
  }

  const objection = objectionMockData.find(
    (item) => item.objectionId === request.objectionId,
  );

  if (!objection) {
    throw new Error('발송할 이의제기 정보를 찾을 수 없습니다.');
  }

  return delay({
    dispatchId: Date.now(),
    objectionId: objection.objectionId,
    customerName: objection.customerName,
    objectionNo: objection.objectionNo,
    dispatchedAt: new Date().toISOString(),
    reviewerName: '김담당',
    reviewResult: request.reviewResult,
    recipientEmail: objection.customerEmail,
    status: 'DISPATCHED',
  });
}