// 이의제기 처리 상태
export type ObjectionStatus = 'WAITING' | 'COMPLETED';

// 담당자의 최종 처리 결과
export type ObjectionReviewResult = 'REJECTED' | 'RE_REVIEW';

// 판단 근거 변수의 영향 수준 (백엔드가 순위를 주지 않아 화면 표시 순서로 임의 부여)
export type ContributorLevel = 'HIGH' | 'MEDIUM' | 'LOW';

// 이의제기 목록에 표시할 기본 정보
export interface ObjectionSummary {
  objectionId: number;
  objectionNo: string;
  customerName: string;
  title: string;
  caseType: string;
  highImpactAi: boolean;
  status: ObjectionStatus;
  createdAt: string;
}

// SHAP 판단 근거 변수 정보 (CSV 원문 텍스트를 파싱해 구성)
export interface ObjectionContributor {
  feature: string;
  label: string;
  value: string;
  level: ContributorLevel;
}

// 답변완료 건의 처리 및 발송 정보
export interface ObjectionCompletionInfo {
  reviewResult: ObjectionReviewResult;
  dispatchedAt: string;
  recipientEmail: string;
}

// 이의제기 상세 정보
export interface ObjectionDetail extends ObjectionSummary {
  content: string;
  contributors: ObjectionContributor[];
  reviewBasis: string;

  // 답변완료 상태일 때만 존재
  completionInfo?: ObjectionCompletionInfo;
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

// 고객 안내문 발송 이력 (엔티티가 발송 1건만 추적하므로 0~1건)
export interface ObjectionDispatchHistory {
  dispatchId: number;
  objectionId: number;
  customerName: string;
  objectionNo: string;
  dispatchedAt: string;
  reviewResult: ObjectionReviewResult;
  status: 'DISPATCHED';
}

// 이의제기 CSV 업로드 결과
export interface ObjectionImportResult {
  importedCount: number;
  objections: ObjectionSummary[];
}