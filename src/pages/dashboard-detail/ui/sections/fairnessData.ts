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

// 원문 출처: model-repo/docs/03-fairlearn-flow.md ("지표 계산 6종" 표 + "용어 쉽게 정리" 절) — 임의 생성 아님
export const COLUMN_TOOLTIP: Record<
  FairlearnMetricCode,
  { title: string; description: string; criteria: string; tip: string }
> = {
  PROPORTIONAL_PARITY: {
    title: 'Proportional Parity (비례성 패리티, 80% Rule)',
    description:
      '그룹별 승인율의 비율(가장 낮은 그룹 ÷ 가장 높은 그룹)이 1에 얼마나 가까운지 봅니다. 미국 EEOC의 오래된 실무 기준(80% Rule)이고, 다른 지표와 달리 "격차"가 아니라 "비율"이라 1에 가까울수록 공정합니다.',
    criteria: 'PASS ≥0.80 · REVIEW 0.70~0.80 · FAIL <0.70',
    tip: '값이 1에 가까울수록 집단별 긍정 예측 비율이 유사합니다. 0.8은 참고 기준입니다.',
  },
  DEMOGRAPHIC_PARITY: {
    title: 'Demographic Parity (인구통계학적 평등성)',
    description:
      '두 집단의 승인율이 비슷한지 봅니다. 정당한 사유로도 차이가 날 수 있어, 확정이 아닌 추가검토 신호로만 사용합니다.',
    criteria: 'PASS ≤0.10 · REVIEW 0.10~0.20 · FAIL >0.20',
    tip: '값이 0에 가까울수록 집단별 긍정 예측 비율의 차이가 작습니다.',
  },
  EQUAL_OPPORTUNITY: {
    title: 'Equal Opportunity (기회의 균등)',
    description:
      '실제로 상환할(연체하지 않을) 사람들만 놓고 봤을 때, 그 안에서 승인율이 그룹마다 같은지 봅니다. Demographic Parity보다 더 정교한 기준이며, FNR(위음성률) Parity와 수학적으로 동일합니다.',
    criteria: 'PASS ≤0.10 · REVIEW 0.10~0.20 · FAIL >0.20',
    tip: '값이 0에 가까울수록 실제 긍정 대상을 발견할 기회가 집단 간 유사합니다.',
  },
  EQUALIZED_ODDS: {
    title: 'Equalized Odds',
    description:
      'TPR 격차(실제 정상 고객을 승인한 비율의 차이)와 FPR 격차(실제 연체 고객을 잘못 승인한 비율의 차이) 중 더 나쁜 쪽을 보여주는 참고 지표입니다. 금융 가이드라인이 요구하는 6종에는 포함되지 않지만, 두 오류 유형을 한 번에 확인하기 위해 같이 봅니다.',
    criteria: 'PASS ≤0.10 · REVIEW 0.10~0.20 · FAIL >0.20',
    tip: '값이 0에 가까울수록 집단 간 정답 및 오류 패턴이 유사합니다.',
  },
  FPR_PARITY: {
    title: 'FPR Parity (거짓 양성률 패리티)',
    description:
      '실제로는 연체할 고객들 중에서, 잘못 승인(오승인)된 비율이 그룹마다 얼마나 다른지 봅니다. 격차가 크면 특정 그룹에서 위험한 고객을 더 많이 통과시키고 있다는 뜻입니다.',
    criteria: 'PASS ≤0.10 · REVIEW 0.10~0.20 · FAIL >0.20',
    tip: '값이 0에 가까울수록 집단별 거짓 양성, 즉 오탐 수준이 유사합니다.',
  },
  FDR_PARITY: {
    title: 'FDR Parity (거짓 발견율 패리티)',
    description:
      '승인된 고객들 중에서, 실제로는 연체할 고객이었던(오승인) 비율이 그룹마다 얼마나 다른지 봅니다. 이게 다르면 "승인 품질"이 그룹마다 다르다는 뜻입니다.',
    criteria: 'PASS ≤0.10 · REVIEW 0.10~0.20 · FAIL >0.20',
    tip: '값이 0에 가까울수록 집단별 긍정 예측의 오류 비율이 유사합니다.',
  },
  FOR_PARITY: {
    title: 'FOR Parity (거짓 누락률 패리티)',
    description:
      '거절된 고객들 중에서, 실제로는 정상 상환할 고객이었던(오거절) 비율이 그룹마다 얼마나 다른지 봅니다. 이게 다르면 억울하게 거절당하는 비율이 그룹마다 다르다는 뜻입니다.',
    criteria: 'PASS ≤0.10 · REVIEW 0.10~0.20 · FAIL >0.20',
    tip: '값이 0에 가까울수록 실제 긍정 대상을 놓치는 비율이 집단 간 유사합니다.',
  },
};

export const FAIRNESS_STATUS_LABEL: Record<string, string> = {
  PASS: '정상',
  REVIEW: '추가검토',
  FAIL: '기준초과',
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

// 테이블 렌더링과 동일한 기준(빈 셀=계산불가)으로 집계 — 로직 중복 방지 위해 같은 groupByAttribute 재사용
export function getFairnessStatusCounts(results: FairlearnResultItem[]) {
  const grouped = groupByAttribute(results);
  let pass = 0;
  let review = 0;
  let fail = 0;
  let na = 0;

  Object.keys(ATTRIBUTE_LABEL).forEach((attribute) => {
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
