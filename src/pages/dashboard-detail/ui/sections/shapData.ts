import type { ShapMetricItem } from '../../../../features/audit/api/auditApi';

export const SHAP_METRIC_LABEL: Record<string, string> = {
  GLOBAL_STABILITY: '설명 일관성',
  FIDELITY: '설명 충실성',
};

export const SHAP_METRIC_RANGE: Record<string, string> = {
  GLOBAL_STABILITY: '기준 0.5~0.7',
  FIDELITY: '기준 ≥0.5',
};

export const SHAP_STATUS_LABEL: Record<string, string> = {
  PASS: 'PASS',
  WARNING: '주의',
  REVIEW: 'REVIEW',
};

// SHAP은 PASS/REVIEW 2단계만 존재(FAIL 없음, model-repo 문서 근거) — WARNING/REVIEW 모두 "주의" 버킷으로 집계
export function getShapStatusCounts(metrics: ShapMetricItem[]) {
  let pass = 0;
  let review = 0;

  metrics.forEach((metric) => {
    if (metric.status === 'PASS') {
      pass += 1;
    } else {
      review += 1;
    }
  });

  return { pass, review };
}
