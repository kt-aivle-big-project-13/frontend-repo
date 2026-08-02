import type { ShapMetricItem } from '../../../../features/audit/api/auditApi';

export const SHAP_METRIC_LABEL: Record<string, string> = {
  SENSITIVE_CONTRIB: '민감변수 기여비율',
  GLOBAL_STABILITY: '설명 일관성',
  FIDELITY: '설명 충실성',
};

export const SHAP_METRIC_RANGE: Record<string, string> = {
  GLOBAL_STABILITY: '기준 0.5~0.7',
  FIDELITY: '기준 ≥0.5',
};

// 도움말 팝오버(MetricHelpTooltip)에 쓰는 설명·기준 문구 — STEP4에서 쓰던 사용자 친화적 카피를 그대로 가져온다.
export const SHAP_METRIC_HELP: Record<string, string> = {
  SENSITIVE_CONTRIB:
    '모델의 판단에 영향을 준 전체 요인 중에서 성별·연령과 같은 민감정보가 직접 차지한 영향의 비율을 보여주는 지표입니다.',
  GLOBAL_STABILITY:
    '분석에 사용하는 고객이나 표본이 조금 달라져도 모델이 중요하다고 설명하는 변수와 그 순서가 비슷하게 유지되는지를 보여주는 지표입니다.',
  FIDELITY:
    'SHAP이 제시한 여러 판단 이유를 종합했을 때 실제 모델의 예측 결과를 얼마나 정확하게 설명하는지를 보여주는 지표입니다.',
};

export const SHAP_METRIC_TIP: Record<string, string> = {
  SENSITIVE_CONTRIB:
    '값이 낮을수록 민감변수의 직접적인 영향이 작습니다. 다만 이 지표만으로 전체 공정성을 판단할 수는 없습니다.',
  GLOBAL_STABILITY: '값이 0.5~0.7 사이면 충족, 범위를 벗어나면 주의로 표시됩니다.',
  FIDELITY: '값이 0.5 이상이면 충족, 미만이면 주의로 표시됩니다.',
};

export const SHAP_STATUS_LABEL: Record<string, string> = {
  PASS: '충족',
  WARNING: '주의',
  REVIEW: '추가검토',
};

// SHAP은 PASS/WARNING/REVIEW 3단계(FAIL 없음, model-repo 문서 근거) — WARNING(주의)과
// REVIEW(추가검토)는 서로 다른 라벨이므로 지표 판정 분포 집계에서도 따로 센다
// (둘을 하나로 합치면 실제 카드/표에 찍힌 라벨과 분포 숫자가 어긋난다).
export function getShapStatusCounts(metrics: ShapMetricItem[]) {
  let pass = 0;
  let warning = 0;
  let review = 0;

  metrics.forEach((metric) => {
    if (metric.status === 'PASS') {
      pass += 1;
    } else if (metric.status === 'WARNING') {
      warning += 1;
    } else {
      review += 1;
    }
  });

  return { pass, warning, review };
}