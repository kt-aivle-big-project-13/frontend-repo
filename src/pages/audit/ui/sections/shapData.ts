import type { ShapMetricItem } from '../../../../features/audit/api/auditApi';

export const SHAP_METRIC_LABEL: Record<string, string> = {
  SENSITIVE_CONTRIB: '민감변수 기여비율',
  GLOBAL_STABILITY: '설명 일관성',
  FIDELITY: '설명 충실성',
};

// 카드에 값과 함께 짧게 붙는 캡션 — 충족 기준값만 보여주고, 3단계 전체 기준은
// 도움말(MetricHelpTooltip)의 SHAP_METRIC_TIP에서 확인할 수 있다.
export const SHAP_METRIC_RANGE: Record<string, string> = {
  GLOBAL_STABILITY: '기준 ≥0.70',
  FIDELITY: '기준 ≥0.50',
};

// 도움말 팝오버(MetricHelpTooltip)에 쓰는 설명 문구.
export const SHAP_METRIC_HELP: Record<string, string> = {
  SENSITIVE_CONTRIB:
    '모델의 판단에 영향을 준 전체 요인 중에서 성별·연령과 같은 민감정보가 직접 차지한 영향의 비율을 보여주는 지표입니다.',
  GLOBAL_STABILITY:
    '분석에 사용하는 고객이나 표본이 조금 달라져도 모델이 중요하다고 설명하는 변수와 그 순서가 비슷하게 유지되는지를 보여주는 지표입니다.',
  FIDELITY:
    'SHAP이 제시한 여러 판단 이유를 종합했을 때 실제 모델의 예측 결과를 얼마나 정확하게 설명하는지를 보여주는 지표입니다.',
};

// 실제 판정 기준 — ai-repo app/services/shap_pipeline.py의 thresholds 설정값
// (global_stability_spearman_min/review_min, explanation_fidelity_min/review_min,
// sensitive_contribution_ratio_max/review_max)과 status_min/status_max 로직 그대로.
// 경계값은 한쪽 상태에만 포함되도록 이상/미만/초과/이하를 명확히 구분해서 표기한다.
export const SHAP_METRIC_TIP: Record<string, string> = {
  SENSITIVE_CONTRIB: '충족은 0.20 이하, 주의는 0.20 초과 0.30 이하, 추가검토는 0.30 초과예요.',
  GLOBAL_STABILITY: '충족은 0.70 이상, 주의는 0.50 이상 0.70 미만, 추가검토는 0.50 미만이에요.',
  FIDELITY: '충족은 0.50 이상, 주의는 0.30 이상 0.50 미만, 추가검토는 0.30 미만이에요.',
};

// SHAP·Fairlearn 전체에서 "충족 > 주의 > 추가검토" 3단계로 라벨을 통일한다 — Fairlearn의
// FAIRNESS_STATUS_LABEL도 같은 3단계로 맞춰져 있다(fairnessData.ts 참고).
export const SHAP_STATUS_LABEL: Record<string, string> = {
  PASS: '충족',
  WARNING: '주의',
  REVIEW: '추가검토',
};

// SHAP은 PASS/WARNING/REVIEW 3단계이고, WARNING(주의)보다 REVIEW(추가검토)가 기준에서 더
// 멀리 벗어난 더 안 좋은 등급이다(ai-repo status_min/status_max 참고) — WARNING과 REVIEW를
// 하나로 합치면 실제 카드에 찍힌 라벨과 분포 숫자가 어긋나므로 지표 판정 분포 집계에서도
// 따로 센다.
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