import type { SelfCheckItem } from './types';

// STEP4_규제자가점검_문항정의서_v1.md 4장 기준 21문항 전체 카탈로그.
// answerType이 YES_NO_NA인 문항(TR-04, SC-02, SC-03, SC-05)에만 "해당없음" 버튼을 그린다 —
// 나머지 17개에 전부 노출하면 "안 해도 되는데 안 했다"는 회피 경로가 생긴다(문서 6장③).
export const SELF_CHECK_ITEMS: SelfCheckItem[] = [
  // TR · 투명성 확보
  {
    code: 'TR-01',
    category: 'TRANSPARENCY',
    question: 'AI 심사 사실을 고객에게 사전에 알리고 있나요?',
    evidenceHint: '확인 위치: 대출 신청 화면, 약관, 상품 설명서',
    answerType: 'YES_NO',
    obligation: 'MANDATORY',
    lawRefs: [{ articleKey: 'AI_BASIC_31_1', label: '제31조① AI 사용 사실 사전 고지' }],
    recommendation:
      'AI 기반으로 심사가 이루어진다는 사실을 신청 화면·약관 등에 사전 고지하도록 개선하시기 바랍니다.',
  },
  {
    code: 'TR-02',
    category: 'TRANSPARENCY',
    question: '학습용데이터의 개요(출처·범위·수집 기간)를 설명 자료로 정리해 두었나요?',
    evidenceHint: '확인 위치: 데이터 정의서, 모델 카드, 데이터 관리대장',
    answerType: 'YES_NO',
    obligation: 'MANDATORY',
    lawRefs: [{ articleKey: 'AI_BASIC_34_1_2', label: '제34조①2호 설명 방안의 수립·시행' }],
    recommendation:
      '학습용데이터의 출처·범위·수집 기간을 정리한 설명 자료를 문서화하도록 개선하시기 바랍니다.',
  },
  {
    code: 'TR-03',
    category: 'TRANSPARENCY',
    question: '위험관리방안·이용자 보호방안·담당자 정보를 이용자가 확인할 수 있도록 게시하고 있나요?',
    evidenceHint: '확인 위치: 홈페이지 공지, AI 이용 안내 페이지',
    answerType: 'YES_NO',
    obligation: 'MANDATORY',
    lawRefs: [{ articleKey: 'AI_BASIC_34_1', label: '제34조① 고영향 AI 사업자 책무(본문)' }],
    recommendation:
      '위험관리방안·이용자 보호방안·담당자 정보를 이용자가 확인할 수 있도록 게시하도록 개선하시기 바랍니다.',
  },
  {
    code: 'TR-04',
    category: 'TRANSPARENCY',
    question: '고객 안내문·답변서를 생성형 AI로 작성하는 경우, 생성 사실을 표시하고 있나요?',
    evidenceHint: '확인 위치: 이의제기 답변서 양식, 고객 발송 문서 템플릿',
    answerType: 'YES_NO_NA',
    obligation: 'CONDITION',
    lawRefs: [{ articleKey: 'AI_BASIC_31_2', label: '제31조② 생성형 AI 결과물 표시' }],
    recommendation: '생성형 AI로 작성한 고객 안내문·답변서에는 생성 사실을 표시하도록 개선하시기 바랍니다.',
  },

  // RM · 위험관리
  {
    code: 'RM-01',
    category: 'RISK',
    question: '위험관리 규정이 수립 및 운영되고 있나요?',
    evidenceHint: '확인 위치: 위험관리 내규, 운영 회의록',
    answerType: 'YES_NO',
    obligation: 'MANDATORY',
    lawRefs: [{ articleKey: 'AI_BASIC_34_1_1', label: '제34조①1호 위험관리방안의 수립·운영' }],
    recommendation: '위험관리방안을 수립하고 운영 체계를 갖추도록 개선하시기 바랍니다.',
  },
  {
    code: 'RM-02',
    category: 'RISK',
    question: 'AI 오류·이상 징후를 상시 모니터링하고, 사고 발생 시 대응하는 절차가 있나요?',
    evidenceHint: '확인 위치: 모니터링 대시보드, 장애 대응 매뉴얼',
    answerType: 'YES_NO',
    obligation: 'MANDATORY',
    lawRefs: [{ articleKey: 'AI_BASIC_34_1_1', label: '제34조①1호 위험관리방안의 수립·운영' }],
    recommendation: 'AI 오류·이상 징후에 대한 상시 모니터링 및 사고 대응 절차를 마련하도록 개선하시기 바랍니다.',
  },
  {
    code: 'RM-03',
    category: 'RISK',
    question: '모델 재학습·중대 변경 시 위험을 재평가하는 주기와 기준이 정해져 있나요?',
    evidenceHint: '확인 위치: 모델 변경관리 절차서, 재검증 이력',
    answerType: 'YES_NO',
    obligation: 'MANDATORY',
    lawRefs: [{ articleKey: 'AI_BASIC_34_1_1', label: '제34조①1호 위험관리방안의 수립·운영' }],
    recommendation: '모델 재학습·중대 변경 시 위험을 재평가하는 주기·기준을 정하도록 개선하시기 바랍니다.',
  },
  {
    code: 'RM-04',
    category: 'RISK',
    question: '고시·위원회 심의·의결 등 변경사항을 확인하고 반영하는 담당자·절차가 있나요?',
    evidenceHint: '확인 위치: 법규 준수 담당자 지정 문서, 개정 이력 관리대장',
    answerType: 'YES_NO',
    obligation: 'MANDATORY',
    lawRefs: [{ articleKey: 'AI_BASIC_34_1_6', label: '제34조①6호 위원회에서 심의·의결된 사항' }],
    recommendation: '고시·위원회 심의·의결 등 변경사항을 확인·반영하는 담당자와 절차를 지정하도록 개선하시기 바랍니다.',
  },

  // UP · 이용자 보호
  {
    code: 'UP-01',
    category: 'USER',
    question: '고객이 심사 결과에 이의를 제기할 절차가 있나요?',
    evidenceHint: '확인 위치: 이의제기 및 재심사 절차서, 고객센터 지침',
    answerType: 'YES_NO',
    obligation: 'MANDATORY',
    lawRefs: [{ articleKey: 'AI_BASIC_34_1_3', label: '제34조①3호 이용자 보호 방안의 수립·운영' }],
    recommendation: '고객이 심사 결과에 이의를 제기할 수 있는 절차를 마련하도록 개선하시기 바랍니다.',
  },
  {
    code: 'UP-02',
    category: 'USER',
    question: 'AI로 인한 피해 발생 시 구제·보상 절차를 마련하고 있나요?',
    evidenceHint: '확인 위치: 고객 피해 구제 지침, 보상 처리 절차서',
    answerType: 'YES_NO',
    obligation: 'MANDATORY',
    lawRefs: [{ articleKey: 'AI_BASIC_34_1_3', label: '제34조①3호 이용자 보호 방안의 수립·운영' }],
    recommendation: 'AI로 인한 피해 발생 시 구제·보상 절차를 마련하도록 개선하시기 바랍니다.',
  },

  // HO · 사람의 관리·감독
  {
    code: 'HO-01',
    category: 'OVERSIGHT',
    question: 'AI 결정을 사람이 관리 및 감독하는 체계가 있나요?',
    evidenceHint: '확인 위치: 승인권자 지정 문서, 심사 개입 프로세스',
    answerType: 'YES_NO',
    obligation: 'MANDATORY',
    lawRefs: [{ articleKey: 'AI_BASIC_34_1_4', label: '제34조①4호 사람의 관리·감독' }],
    recommendation: 'AI 결정을 사람이 관리·감독할 수 있는 체계를 구축하도록 개선하시기 바랍니다.',
  },
  {
    code: 'HO-02',
    category: 'OVERSIGHT',
    question: 'AI 심사 결과에 사람이 개입하거나 번복한 이력을 기록·보관하고 있나요?',
    evidenceHint: '확인 위치: 심사 개입·번복 이력대장, 승인 로그',
    answerType: 'YES_NO',
    obligation: 'MANDATORY',
    lawRefs: [
      { articleKey: 'AI_BASIC_34_1_4', label: '제34조①4호 사람의 관리·감독' },
      { articleKey: 'AI_BASIC_34_1_5', label: '제34조①5호 문서의 작성과 보관' },
    ],
    recommendation: 'AI 심사 결과에 대한 사람의 개입·번복 이력을 기록·보관하도록 개선하시기 바랍니다.',
  },

  // DC · 문서 작성·보관
  {
    code: 'DC-01',
    category: 'DOCUMENT',
    question: '조치 내용을 문서로 작성 및 보관하고 있나요?',
    evidenceHint: '확인 위치: 감사 대응 문서함, 조치 이력 관리대장',
    answerType: 'YES_NO',
    obligation: 'MANDATORY',
    lawRefs: [{ articleKey: 'AI_BASIC_34_1_5', label: '제34조①5호 문서의 작성과 보관' }],
    recommendation: '안전성·신뢰성 확보 조치 내용을 확인할 수 있는 문서를 작성·보관하도록 개선하시기 바랍니다.',
  },
  {
    code: 'DC-02',
    category: 'DOCUMENT',
    question: '모델 변경·법령 개정 시 문서를 최신 상태로 유지·점검하고 있나요?',
    evidenceHint: '확인 위치: 문서 최신화 점검 이력, 법령 개정 대응 기록',
    answerType: 'YES_NO',
    obligation: 'MANDATORY',
    lawRefs: [
      { articleKey: 'AI_BASIC_34_1_5', label: '제34조①5호 문서의 작성과 보관' },
      { articleKey: 'AI_BASIC_36_1', label: '제36조① 국내대리인 지정' },
    ],
    recommendation: '모델 변경·법령 개정 시 관련 문서를 최신 상태로 점검·유지하도록 개선하시기 바랍니다.',
  },

  // IA · 영향평가 (노력의무)
  {
    code: 'IA-01',
    category: 'IMPACT',
    question: '서비스 제공 전 사람의 기본권에 미치는 영향을 평가하고 문서화했나요?',
    evidenceHint: '확인 위치: 기본권 영향평가 보고서, 서비스 출시 검토 문서',
    answerType: 'YES_NO',
    obligation: 'EFFORT',
    lawRefs: [{ articleKey: 'AI_BASIC_35_1', label: '제35조① 고영향 AI 영향평가' }],
    recommendation: '영향평가는 노력 의무이나, 서비스 제공 전 사전 수행 및 문서화를 권고드립니다.',
  },
  {
    code: 'IA-02',
    category: 'IMPACT',
    question: '영향평가 시 고령자·장애인 등 인공지능취약계층의 특성을 반영했나요?',
    evidenceHint: '확인 위치: 영향평가 보고서 내 취약계층 반영 항목',
    answerType: 'YES_NO',
    obligation: 'EFFORT',
    lawRefs: [{ articleKey: 'AI_BASIC_35_1', label: '제35조① 고영향 AI 영향평가' }],
    recommendation: '영향평가는 노력 의무이나, 고령자·장애인 등 취약계층 특성을 반영한 평가를 권고드립니다.',
  },

  // SC · 적용범위·사업자 지위
  {
    code: 'SC-01',
    category: 'SCOPE',
    question: '이 AI에 대한 귀사의 지위(개발사업자/이용사업자)를 확인하고 책임 범위를 정리했나요?',
    evidenceHint: '확인 위치: 사업자 지위 확인서, 책임 범위 정의 문서',
    answerType: 'YES_NO',
    obligation: 'PREMISE',
    lawRefs: [
      { articleKey: 'AI_BASIC_2_7', label: '제2조7호 인공지능사업자의 정의' },
      { articleKey: 'AI_BASIC_34_1', label: '제34조① 고영향 AI 사업자 책무(본문)' },
    ],
    recommendation: '개발사업자·이용사업자 중 귀사의 지위를 확인하고 책임 범위를 문서로 정리하도록 권고드립니다.',
  },
  {
    code: 'SC-02',
    category: 'SCOPE',
    question: '다른 법령에 따른 조치로 갈음하는 항목의 대응표를 문서화했나요?',
    evidenceHint: '확인 위치: 신용정보법·금융소비자보호법 대응표',
    answerType: 'YES_NO_NA',
    obligation: 'CONDITION',
    lawRefs: [{ articleKey: 'AI_BASIC_34_3', label: '제34조③ 다른 법령에 따른 조치의 인정' }],
    recommendation: '다른 법령으로 갈음하는 조치가 있다면 조항 간 대응관계를 문서화하도록 권고드립니다.',
  },
  {
    code: 'SC-03',
    category: 'SCOPE',
    question: '해외 사업자의 AI를 도입한 경우 국내대리인 지정 여부를 확인했나요?',
    evidenceHint: '확인 위치: 국내대리인 지정·신고 서류',
    answerType: 'YES_NO_NA',
    obligation: 'CONDITION',
    lawRefs: [{ articleKey: 'AI_BASIC_36_1', label: '제36조① 국내대리인 지정' }],
    recommendation: '해외 사업자의 AI를 도입한 경우 국내대리인 지정 여부를 확인하도록 권고드립니다.',
  },
  {
    code: 'SC-04',
    category: 'SCOPE',
    question: '고영향 AI에 대해 사전 검·인증 취득을 검토했나요?',
    evidenceHint: '확인 위치: 검·인증 검토 보고서, 인증기관 문의 이력',
    answerType: 'YES_NO',
    obligation: 'EFFORT',
    lawRefs: [{ articleKey: 'AI_BASIC_30_3', label: '제30조③ 고영향 AI 검·인증 노력' }],
    recommendation: '사전 검·인증은 노력 의무이나, 취득 검토를 권고드립니다.',
  },
  {
    code: 'SC-05',
    category: 'SCOPE',
    question: '학습에 사용된 누적 연산량이 대통령령 기준 이상인지 확인했나요?',
    evidenceHint: '확인 위치: 학습 연산량 산정 자료',
    answerType: 'YES_NO_NA',
    obligation: 'CONDITION',
    lawRefs: [{ articleKey: 'AI_BASIC_32_1', label: '제32조① 인공지능 안전성 확보 의무' }],
    recommendation: '학습 누적 연산량이 대통령령 기준 이상인지 확인하도록 권고드립니다.',
  },
];

export const TOTAL_SELF_CHECK_ITEM_COUNT = SELF_CHECK_ITEMS.length;
