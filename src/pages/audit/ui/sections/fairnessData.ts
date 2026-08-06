import type {
  FairlearnMetricCode,
  FairlearnResultItem,
} from '../../../../features/audit/api/auditApi';

export const ATTRIBUTE_LABEL: Record<string, string> = {
  AGE_GROUP: '연령대 (AGE_GROUP)',
  CODE_GENDER: '성별 (CODE_GENDER)',
};

export const COLUMN_ORDER: FairlearnMetricCode[] = [
  'PROPORTIONAL_PARITY',
  'DEMOGRAPHIC_PARITY',
  'EQUAL_OPPORTUNITY',
  'EQUALIZED_ODDS',
  'FPR_PARITY',
  'FDR_PARITY',
  'FOR_PARITY',
];

export const COLUMN_LABEL: Record<FairlearnMetricCode, string> = {
  PROPORTIONAL_PARITY: 'Proportional Parity',
  DEMOGRAPHIC_PARITY: 'Demographic Parity',
  EQUAL_OPPORTUNITY: 'Equal Opportunity',
  EQUALIZED_ODDS: 'Equalized Odds',
  FPR_PARITY: 'FPR',
  FDR_PARITY: 'FDR',
  FOR_PARITY: 'FOR',
};

// 판정 설명은 model-repo/docs/03-fairlearn-flow.md("용어 쉽게 정리" 절)에서, 판정 기준(criteria)의
// 실제 숫자는 backend-repo FairnessResultService.java의 judgeStatus/judgeRatioStatus 로직
// 그대로 가져온다(격차형 threshold=0.20·REVIEW_THRESHOLD_MULTIPLIER=2, 비율형
// minRatio=0.80·REVIEW_MARGIN=0.10). 그 파일에는 "정책값 미확정, AI팀/기획 확정 후 조정 필요"라는
// TODO가 달려있어 향후 바뀔 수 있다 — 바뀌면 여기도 같이 고쳐야 한다.
// 경계값은 한쪽 상태에만 포함되도록 이상/미만/초과/이하를 명확히 구분해서 표기한다.
export const COLUMN_TOOLTIP: Record<
  FairlearnMetricCode,
  { title: string; description: string; criteria: string; tip: string }
> = {
  PROPORTIONAL_PARITY: {
    title: 'Proportional Parity (비례성 패리티, 80% Rule)',
    description:
      '그룹별 승인율의 비율(가장 낮은 그룹 ÷ 가장 높은 그룹)이 1에 얼마나 가까운지 봅니다. 미국 EEOC의 오래된 실무 기준(80% Rule)이고, 다른 지표와 달리 "격차"가 아니라 "비율"이라 1에 가까울수록 공정합니다.',
    criteria: '충족은 0.80 이상, 주의는 0.70 이상 0.80 미만, 추가검토는 0.70 미만이에요.',
    tip: '값이 1에 가까울수록 집단별 긍정 예측 비율이 유사합니다. 0.80은 판정 기준입니다.',
  },
  DEMOGRAPHIC_PARITY: {
    title: 'Demographic Parity (인구통계학적 평등성)',
    description:
      '두 집단의 승인율이 비슷한지 봅니다. 정당한 사유로도 차이가 날 수 있어, 확정이 아닌 주의·추가검토 신호로만 사용합니다.',
    criteria: '충족은 0.20 이하, 주의는 0.20 초과 0.40 이하, 추가검토는 0.40 초과예요.',
    tip: '값이 0에 가까울수록 집단별 긍정 예측 비율의 차이가 작습니다.',
  },
  EQUAL_OPPORTUNITY: {
    title: 'Equal Opportunity (기회의 균등)',
    description:
      '실제로 상환할(연체하지 않을) 사람들만 놓고 봤을 때, 그 안에서 승인율이 그룹마다 같은지 봅니다. Demographic Parity보다 더 정교한 기준이며, FNR(위음성률) Parity와 수학적으로 동일합니다.',
    criteria: '충족은 0.20 이하, 주의는 0.20 초과 0.40 이하, 추가검토는 0.40 초과예요.',
    tip: '값이 0에 가까울수록 실제 긍정 대상을 발견할 기회가 집단 간 유사합니다.',
  },
  EQUALIZED_ODDS: {
    title: 'Equalized Odds (균등화 승산)',
    description:
      'TPR 격차(실제 정상 고객을 승인한 비율의 차이)와 FPR 격차(실제 연체 고객을 잘못 승인한 비율의 차이) 중 더 나쁜 쪽을 보여주는 참고 지표입니다. 금융 가이드라인이 요구하는 6종에는 포함되지 않지만, 두 오류 유형을 한 번에 확인하기 위해 같이 봅니다.',
    criteria: '충족은 0.20 이하, 주의는 0.20 초과 0.40 이하, 추가검토는 0.40 초과예요.',
    tip: '값이 0에 가까울수록 집단 간 정답 및 오류 패턴이 유사합니다.',
  },
  FPR_PARITY: {
    title: 'FPR Parity (거짓 양성률 패리티)',
    description:
      '실제로는 연체할 고객들 중에서, 잘못 승인(오승인)된 비율이 그룹마다 얼마나 다른지 봅니다. 격차가 크면 특정 그룹에서 위험한 고객을 더 많이 통과시키고 있다는 뜻입니다.',
    criteria: '충족은 0.20 이하, 주의는 0.20 초과 0.40 이하, 추가검토는 0.40 초과예요.',
    tip: '값이 0에 가까울수록 집단별 거짓 양성, 즉 오탐 수준이 유사합니다.',
  },
  FDR_PARITY: {
    title: 'FDR Parity (거짓 발견율 패리티)',
    description:
      '승인된 고객들 중에서, 실제로는 연체할 고객이었던(오승인) 비율이 그룹마다 얼마나 다른지 봅니다. 이게 다르면 "승인 품질"이 그룹마다 다르다는 뜻입니다.',
    criteria: '충족은 0.20 이하, 주의는 0.20 초과 0.40 이하, 추가검토는 0.40 초과예요.',
    tip: '값이 0에 가까울수록 집단별 긍정 예측의 오류 비율이 유사합니다.',
  },
  FOR_PARITY: {
    title: 'FOR Parity (거짓 누락률 패리티)',
    description:
      '거절된 고객들 중에서, 실제로는 정상 상환할 고객이었던(오거절) 비율이 그룹마다 얼마나 다른지 봅니다. 이게 다르면 억울하게 거절당하는 비율이 그룹마다 다르다는 뜻입니다.',
    criteria: '충족은 0.20 이하, 주의는 0.20 초과 0.40 이하, 추가검토는 0.40 초과예요.',
    tip: '값이 0에 가까울수록 실제 긍정 대상을 놓치는 비율이 집단 간 유사합니다.',
  },
};

// SHAP·Fairlearn 전체에서 "충족 > 주의 > 추가검토" 3단계로 라벨을 통일한다(shapData.ts의
// SHAP_STATUS_LABEL과 동일한 3단계). Fairlearn 원래 상태값 이름(PASS/REVIEW/FAIL)과 화면
// 라벨이 더는 1:1로 안 겹치니 주의: REVIEW(중간 등급)는 "주의", FAIL(최하 등급)은
// "추가검토"로 표시한다 — "기준초과"라는, 실제로 어디에도 안 쓰이던 이름은 없앴다.
export const FAIRNESS_STATUS_LABEL: Record<string, string> = {
  PASS: '충족',
  REVIEW: '주의',
  FAIL: '추가검토',
};

export function groupByAttribute(results: FairlearnResultItem[]) {
  const map = new Map<string, Map<FairlearnMetricCode, FairlearnResultItem>>();

  results.forEach((item) => {
    const row = map.get(item.attribute) ?? new Map();
    row.set(item.metricCode, item);
    map.set(item.attribute, row);
  });

  return map;
}

// 화면에 그릴 민감변수 목록. 감사마다 선택하는 민감변수가 달라 ATTRIBUTE_LABEL에 없는 컬럼도
// 오므로 목록은 반드시 응답 데이터에서 뽑는다 — 라벨 맵을 순회하면 성별·연령 외 변수가 통째로
// 빠진다. 여러 버전을 함께 넘기면 합집합을 만든다(한쪽에만 있는 변수도 비교표에 남겨야 하기
// 때문). 순서는 익숙한 성별·연령을 먼저 두고, 나머지는 응답에 나온 순서를 그대로 따른다.
export function listAttributes(...resultGroups: FairlearnResultItem[][]): string[] {
  const found: string[] = [];

  resultGroups.forEach((results) =>
    results.forEach((item) => {
      if (!found.includes(item.attribute)) found.push(item.attribute);
    }),
  );

  const known = Object.keys(ATTRIBUTE_LABEL).filter((attribute) => found.includes(attribute));

  return [...known, ...found.filter((attribute) => !(attribute in ATTRIBUTE_LABEL))];
}

// 테이블 렌더링과 동일한 기준(빈 셀=계산불가)으로 집계 — 로직 중복 방지 위해 같은 groupByAttribute
// 재사용. 반환값은 화면 라벨이 아니라 원래 상태 코드(PASS/REVIEW/FAIL) 기준이므로, 호출하는
// 쪽에서 "지표 판정 분포"처럼 SHAP과 합산할 때는 FAIRNESS_STATUS_LABEL 매핑(REVIEW→주의,
// FAIL→추가검토)에 맞춰 review는 "주의" 합계에, fail은 "추가검토" 합계에 더해야 한다.
export function getFairnessStatusCounts(results: FairlearnResultItem[]) {
  const grouped = groupByAttribute(results);
  let pass = 0;
  let review = 0;
  let fail = 0;
  let na = 0;

  listAttributes(results).forEach((attribute) => {
    const row = grouped.get(attribute);

    COLUMN_ORDER.forEach((code) => {
      const cell = row?.get(code);

      if (!cell) {
        na += 1;
      } else if (cell.status === 'PASS') {
        pass += 1;
      } else if (cell.status === 'REVIEW') {
        review += 1;
      } else {
        fail += 1;
      }
    });
  });

  return { pass, review, fail, na };
}
