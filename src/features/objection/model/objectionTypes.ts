// 이의제기 처리 상태
export type ObjectionStatus = 'WAITING' | 'COMPLETED';

// 담당자의 최종 처리 결과
export type ObjectionReviewResult = 'REJECTED' | 'RE_REVIEW';

// 판단 근거 변수의 영향 수준
export type ContributorLevel = 'HIGH' | 'MEDIUM' | 'LOW';

// 이의제기 목록에 표시할 기본 정보
export interface ObjectionSummary {
  objectionId: number;
  objectionNo: string;
  customerName: string;
  title: string;
  status: ObjectionStatus;
  createdAt: string;
}

// SHAP 판단 근거 변수 정보
export interface ObjectionContributor {
  feature: string;
  label: string;
  value: string;
  level: ContributorLevel;
}

// 이의제기 상세 정보
export interface ObjectionDetail extends ObjectionSummary {
  content: string;
  caseType: string;
  highImpactAi: boolean;
  auditId: number;
  modelName: string;
  contributors: ObjectionContributor[];
  reviewBasis: string;
}

// 생성된 고객 대응문서 정보
export interface ObjectionDocument {
  objectionId: number;
  objectionNo: string;
  customerName: string;
  reviewResult: ObjectionReviewResult;
  explanation: string;
  letterTitle: string;
  letterBody: string;
}

// 고객 안내문 발송 이력
export interface ObjectionDispatchHistory {
  dispatchId: number;
  objectionId: number;
  customerName: string;
  objectionNo: string;
  dispatchedAt: string;
  reviewerName: string;
  reviewResult: ObjectionReviewResult;
  status: 'DISPATCHED';
}