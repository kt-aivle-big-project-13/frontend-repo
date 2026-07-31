import type {
  ObjectionDetail,
  ObjectionDispatchHistory,
  ObjectionDocument,
} from './objectionTypes';

export const objectionMockData: ObjectionDetail[] = [
  {
    objectionId: 412,
    objectionNo: '2026-0412',
    customerName: '조영',
    title: '왜 거절이 됐나!',
    content:
      '저는 신용 점수가 800점 이상인데 왜 거절되었죠?',
    status: 'WAITING',
    createdAt: '2026-07-31T10:01:00',
    caseType: '대출 심사 거절 건',
    highImpactAi: true,
    auditId: 21,
    modelName: 'CreditRisk-XGB v1.0',
    contributors: [
      {
        feature: 'debtRatio',
        label: '부채비율',
        value: '82%',
        level: 'HIGH',
      },
      {
        feature: 'delinquencyHistory',
        label: '연체이력',
        value: '2건 / 6개월',
        level: 'MEDIUM',
      },
      {
        feature: 'creditScore',
        label: '신용점수',
        value: '812점',
        level: 'LOW',
      },
    ],
    reviewBasis:
      '최근 6개월 내 연체 이력 2건이 확인되었으며, 부채비율이 심사 임계치 70%를 12%p 초과하여 종합 위험도가 높게 산정되었습니다. 신용점수는 기준을 충족하나 상환능력 지표가 우선 반영되어 거절 판정에 이르렀습니다.',
  },
  {
    objectionId: 411,
    objectionNo: '2026-0411',
    customerName: '황민',
    title: '날 승인해 달라!',
    content:
      '소득도 충분하고 연체 이력도 없는데 대출이 거절된 이유를 알고 싶습니다.',
    status: 'WAITING',
    createdAt: '2026-07-30T15:20:00',
    caseType: '대출 심사 거절 건',
    highImpactAi: true,
    auditId: 21,
    modelName: 'CreditRisk-XGB v1.0',
    contributors: [
      {
        feature: 'employmentPeriod',
        label: '재직기간',
        value: '8개월',
        level: 'HIGH',
      },
      {
        feature: 'incomeStability',
        label: '소득 안정성',
        value: '주의',
        level: 'MEDIUM',
      },
      {
        feature: 'existingLoan',
        label: '기존 대출',
        value: '2건',
        level: 'MEDIUM',
      },
    ],
    reviewBasis:
      '현재 소득 수준은 기준을 충족하였으나 재직기간이 짧고 기존 대출 건수가 복합적으로 반영되어 상환 안정성이 낮게 평가되었습니다.',
  },
  {
    objectionId: 410,
    objectionNo: '2026-0410',
    customerName: '김다',
    title: '한도가 왜 이렇게 낮은가요',
    content:
      '기존에 안내받은 금액보다 승인 한도가 낮게 책정된 이유가 궁금합니다.',
    status: 'COMPLETED',
    createdAt: '2026-07-28T09:52:00',
    caseType: '대출 한도 이의제기',
    highImpactAi: true,
    auditId: 20,
    modelName: 'CreditLimit-XGB v1.2',
    contributors: [
      {
        feature: 'debtServiceRatio',
        label: '원리금 상환비율',
        value: '47%',
        level: 'HIGH',
      },
      {
        feature: 'loanBalance',
        label: '기존 대출 잔액',
        value: '3,100만원',
        level: 'MEDIUM',
      },
      {
        feature: 'annualIncome',
        label: '연소득',
        value: '4,200만원',
        level: 'LOW',
      },
    ],
    reviewBasis:
      '연소득은 기준을 충족하였으나 원리금 상환비율과 기존 대출 잔액이 반영되어 승인 한도가 조정되었습니다.',
    completionInfo: {
      reviewResult: 'REJECTED',
      dispatchedAt: '2026-07-28T14:30:00',
      reviewerName: '김담당',
      recipientEmail: 'ki***@example.com',
    },
  },
  {
    objectionId: 409,
    objectionNo: '2026-0409',
    customerName: '김다',
    title: '서류를 다시 확인해주세요',
    content:
      '제출한 소득 증빙 서류가 정상적으로 반영되었는지 다시 확인해주세요.',
    status: 'COMPLETED',
    createdAt: '2026-07-26T16:10:00',
    caseType: '서류 재검토 요청',
    highImpactAi: false,
    auditId: 20,
    modelName: 'CreditLimit-XGB v1.2',
    contributors: [
      {
        feature: 'incomeDocument',
        label: '소득 증빙',
        value: '일부 누락',
        level: 'HIGH',
      },
      {
        feature: 'employmentStatus',
        label: '재직 상태',
        value: '재직',
        level: 'LOW',
      },
    ],
    reviewBasis:
      '제출된 소득 증빙 자료 중 일부 항목이 누락된 것으로 확인되어 추가 서류 검토가 필요합니다.',
    completionInfo: {
      reviewResult: 'RE_REVIEW',
      dispatchedAt: '2026-07-26T17:20:00',
      reviewerName: '김담당',
      recipientEmail: 'kd***@example.com',
    },
  },
  {
    objectionId: 408,
    objectionNo: '2026-0408',
    customerName: '김석',
    title: '금리가 타행보다 높습니다',
    content:
      '동일한 조건인데 다른 금융기관보다 금리가 높게 산정된 이유를 확인하고 싶습니다.',
    status: 'WAITING',
    createdAt: '2026-07-24T13:45:00',
    caseType: '금리 산정 이의제기',
    highImpactAi: true,
    auditId: 19,
    modelName: 'InterestRate-XGB v1.0',
    contributors: [
      {
        feature: 'collateral',
        label: '담보 여부',
        value: '무담보',
        level: 'HIGH',
      },
      {
        feature: 'creditGrade',
        label: '신용등급',
        value: '4등급',
        level: 'MEDIUM',
      },
      {
        feature: 'loanPeriod',
        label: '대출기간',
        value: '60개월',
        level: 'MEDIUM',
      },
    ],
    reviewBasis:
      '신용등급과 대출기간, 무담보 조건이 종합적으로 반영되어 기준 금리에 가산금리가 적용되었습니다.',
  },
];

export const objectionDocumentMockData: Record<
  number,
  ObjectionDocument
> = {
  412: {
    objectionId: 412,
    objectionNo: '2026-0412',
    customerName: '조영',
    reviewResult: 'REJECTED',
    explanation:
      '최근 6개월 내 연체 이력 2건이 확인되었으며, 부채비율이 심사 임계치 70%를 12%p 초과하여 종합 위험도가 높게 산정되었습니다. 신용점수는 기준을 충족하나 상환능력 지표가 우선 반영되어 거절 판정에 이르렀습니다.',
    letterTitle: '신용평가 결과 이의제기 회신 안내',
    letterBody:
      '안녕하세요, 고객님. 신청하신 대출 심사 결과를 안내드립니다.\n\n검토 결과 최근 6개월 내 연체 이력 2건이 확인되었으며, 부채비율이 심사 임계치 70%를 12%p 초과하여 종합 위험도가 높게 산정되었습니다. 신용점수는 기준을 충족하나 상환능력 지표가 우선 반영되어 거절 판정에 이르렀습니다.\n\n관련하여 궁금하신 사항은 이의제기 화면을 통해 다시 문의해주시면 담당자가 성실히 답변드리겠습니다. 감사합니다.',
  },
  411: {
    objectionId: 411,
    objectionNo: '2026-0411',
    customerName: '황민',
    reviewResult: 'RE_REVIEW',
    explanation:
      '현재 소득 수준은 기준을 충족하였으나 재직기간이 짧고 기존 대출 건수가 복합적으로 반영되어 상환 안정성이 낮게 평가되었습니다.',
    letterTitle: '신용평가 재심사 안내',
    letterBody:
      '안녕하세요, 고객님. 접수하신 이의제기 내용을 검토한 결과 추가 자료를 바탕으로 재심사를 진행할 예정입니다.',
  },
  410: {
    objectionId: 410,
    objectionNo: '2026-0410',
    customerName: '김다',
    reviewResult: 'REJECTED',
    explanation:
      '연소득은 기준을 충족하였으나 원리금 상환비율과 기존 대출 잔액이 반영되어 승인 한도가 조정되었습니다.',
    letterTitle: '대출 한도 이의제기 회신 안내',
    letterBody:
      '안녕하세요, 고객님. 접수하신 대출 한도 관련 이의제기 검토 결과를 안내드립니다.\n\n연소득은 기준을 충족하였으나 원리금 상환비율과 기존 대출 잔액이 반영되어 승인 한도가 조정되었습니다.\n\n검토 결과 기존 한도 산정 결과를 유지하기로 결정했습니다. 감사합니다.',
  },
  409: {
    objectionId: 409,
    objectionNo: '2026-0409',
    customerName: '김다',
    reviewResult: 'RE_REVIEW',
    explanation:
      '제출된 소득 증빙 자료 중 일부 항목이 누락된 것으로 확인되어 추가 서류 검토가 필요합니다.',
    letterTitle: '소득 증빙 서류 재검토 안내',
    letterBody:
      '안녕하세요, 고객님. 제출하신 소득 증빙 서류를 확인한 결과 일부 항목의 추가 확인이 필요합니다.\n\n필요한 자료를 다시 확인한 후 재심사를 진행하겠습니다. 감사합니다.',
  },
};

export const objectionDispatchHistoryMockData: ObjectionDispatchHistory[] = [
  {
    dispatchId: 1,
    objectionId: 410,
    customerName: '김다',
    objectionNo: '2026-0410',
    dispatchedAt: '2026-07-28T14:30:00',
    reviewerName: '김담당',
    reviewResult: 'REJECTED',
    recipientEmail: 'ki***@example.com',
    status: 'DISPATCHED',
  },
  {
    dispatchId: 2,
    objectionId: 409,
    customerName: '김다',
    objectionNo: '2026-0409',
    dispatchedAt: '2026-07-26T17:20:00',
    reviewerName: '김담당',
    reviewResult: 'RE_REVIEW',
    recipientEmail: 'kd***@example.com',
    status: 'DISPATCHED',
  },
];