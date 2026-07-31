import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getFairness,
  getExplainability,
  type FairlearnResultItem,
  type ShapMetricItem,
} from '../../../../features/audit/api/auditApi';
import {
  getSelectedDeliverables,
  setSelectedDeliverables as persistSelectedDeliverables,
} from '../../../../features/audit/model/deliverableSelection';
import { markAuditResultsViewed } from '../../../../features/audit/model/viewedAuditResults';
import MetricHelpTooltip from '../../../../features/audit/ui/MetricHelpTooltip';
import StepIndicator from '../StepIndicator';

import './AuditFlow.css';

interface Deliverable {
  id: string;
  label: string;
}

const DELIVERABLES: Deliverable[] = [
  { id: 'high-impact-ai', label: '고영향 AI 사전진단' },
  { id: 'shap-report', label: '설명가능성 리포트 (SHAP)' },
  { id: 'fairness-report', label: '편향 진단 보고서 (Fairlearn)' },
  { id: 'compliance-verdict', label: '규제준수 판정서' },
  { id: 'improvement-guide', label: '개선 권고 가이드' },
];

// 형식(PDF/Word)을 특정하지 않는 범용 문서 아이콘 — 대시보드 상세보기의
// reports-section__card-icon과 같은 스타일을 쓴다.
function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M6 2.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 20V4A1.5 1.5 0 0 1 6 2.5Z"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 2.5V7h4" stroke="#ffffff" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 12h8M8 15.5h8M8 18.5h5" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// 기본값은 전체 선택 — 선택 해제한 산출물은 대시보드 상세보기에서도 보이지 않는다.
const DEFAULT_SELECTED_DELIVERABLES = new Set(DELIVERABLES.map((deliverable) => deliverable.id));

type ShapMetricCode = ShapMetricItem['metricCode'];
type ShapStatus = ShapMetricItem['status'];

const SHAP_METRIC_LABEL: Record<ShapMetricCode, string> = {
  SENSITIVE_CONTRIB: '민감변수 기여비율 (SENSITIVE_CONTRIB)',
  GLOBAL_STABILITY: '설명 일관성 (GLOBAL_STABILITY)',
  FIDELITY: '설명 충실성 (FIDELITY)',
};

const SHAP_METRIC_HELP: Record<ShapMetricCode, string> = {
  SENSITIVE_CONTRIB:
    '모델의 판단에 영향을 준 전체 요인 중에서 성별·연령과 같은 민감정보가 직접 차지한 영향의 비율을 보여주는 지표입니다.',

  GLOBAL_STABILITY:
    '분석에 사용하는 고객이나 표본이 조금 달라져도 모델이 중요하다고 설명하는 변수와 그 순서가 비슷하게 유지되는지를 보여주는 지표입니다.',

  FIDELITY:
    'SHAP이 제시한 여러 판단 이유를 종합했을 때 실제 모델의 예측 결과를 얼마나 정확하게 설명하는지를 보여주는 지표입니다.',
};

const SHAP_METRIC_TIP: Record<ShapMetricCode, string> = {
  SENSITIVE_CONTRIB:
    '값이 낮을수록 민감변수의 직접적인 영향이 작습니다. 다만 이 지표만으로 전체 공정성을 판단할 수는 없습니다.',

  GLOBAL_STABILITY: '값이 1에 가까울수록 표본 변화에도 설명이 안정적으로 유지됩니다.',

  FIDELITY: '값이 1에 가까울수록 SHAP 설명이 실제 모델 예측을 충실하게 반영합니다.',
};

const SHAP_STATUS_LABEL: Record<ShapStatus, string> = {
  PASS: '충족',
  WARNING: '주의',
  REVIEW: '추가검토',
};

const SHAP_STATUS_VARIANT: Record<ShapStatus, 'good' | 'caution' | 'bad'> = {
  PASS: 'good',
  WARNING: 'caution',
  REVIEW: 'bad',
};

type FairlearnMetricCode = FairlearnResultItem['metricCode'];
type FairlearnStatus = FairlearnResultItem['status'];

function groupFairnessByAttribute(
  results: FairlearnResultItem[],
): [string, FairlearnResultItem[]][] {
  return Array.from(
    results.reduce((groups, item) => {
      const list = groups.get(item.attribute) ?? [];
      list.push(item);
      groups.set(item.attribute, list);
      return groups;
    }, new Map<string, FairlearnResultItem[]>()),
  );
}

const FAIRNESS_ATTRIBUTE_LABEL: Record<string, string> = {
  CODE_GENDER: '성별 (CODE_GENDER)',
  AGE_GROUP: '연령대 (AGE_GROUP)',
};

const FAIRNESS_METRIC_LABEL: Record<FairlearnMetricCode, string> = {
  DEMOGRAPHIC_PARITY: 'Demographic Parity',
  EQUAL_OPPORTUNITY: 'Equal Opportunity',
  EQUALIZED_ODDS: 'Equalized Odds',
  PROPORTIONAL_PARITY: '비례성 패리티 (Proportional Parity, 80% Rule)',
  FPR_PARITY: '거짓 양성률 패리티 (FPR Parity)',
  FDR_PARITY: '거짓 발견율 패리티 (FDR Parity)',
  FOR_PARITY: '거짓 누락률 패리티 (FOR Parity)',
};

const FAIRNESS_METRIC_HELP: Record<FairlearnMetricCode, string> = {
  DEMOGRAPHIC_PARITY:
    '성별이나 연령대 같은 집단별로 긍정적인 결과를 받은 비율이 얼마나 차이 나는지 보여주는 지표입니다. 긍정적인 결과는 업무에 따라 승인이나 합격 등을 의미할 수 있습니다.',

  PROPORTIONAL_PARITY:
    '긍정적인 결과를 가장 적게 받은 집단의 비율을 가장 많이 받은 집단과 비교해, 두 집단의 결과 비율이 어느 정도 비슷한지 보여주는 지표입니다.',

  EQUAL_OPPORTUNITY:
    '실제로 긍정적인 결과를 받을 조건을 갖춘 대상이 모델에서도 긍정적으로 판단될 기회가 집단별로 얼마나 차이 나는지 보여주는 지표입니다.',

  EQUALIZED_ODDS:
    '모델이 정답을 맞히거나 잘못 판단하는 비율이 특정 집단에서 더 높거나 낮지 않은지 종합적으로 확인하는 지표입니다.',

  FPR_PARITY:
    '실제로는 부정적인 대상인데 모델이 긍정적으로 잘못 판단한 비율이 집단별로 얼마나 차이 나는지 보여주는 지표입니다.',

  FDR_PARITY:
    '모델이 긍정적으로 판단한 대상 중 실제로는 부정적인 대상이 포함된 비율이 집단별로 얼마나 차이 나는지 보여주는 지표입니다.',

  FOR_PARITY:
    '모델이 부정적으로 판단한 대상 중 실제로는 긍정적인 대상이 포함된 비율이 집단별로 얼마나 차이 나는지 보여주는 지표입니다.',
};

const FAIRNESS_METRIC_TIP: Record<FairlearnMetricCode, string> = {
  DEMOGRAPHIC_PARITY: '값이 0에 가까울수록 집단별 긍정 예측 비율의 차이가 작습니다.',
  PROPORTIONAL_PARITY:
    '값이 1에 가까울수록 집단별 긍정 예측 비율이 유사합니다. 0.8은 참고 기준입니다.',
  EQUAL_OPPORTUNITY: '값이 0에 가까울수록 실제 긍정 대상을 발견할 기회가 집단 간 유사합니다.',
  EQUALIZED_ODDS: '값이 0에 가까울수록 집단 간 정답 및 오류 패턴이 유사합니다.',
  FPR_PARITY: '값이 0에 가까울수록 집단별 거짓 양성, 즉 오탐 수준이 유사합니다.',
  FDR_PARITY: '값이 0에 가까울수록 집단별 긍정 예측의 오류 비율이 유사합니다.',
  FOR_PARITY: '값이 0에 가까울수록 실제 긍정 대상을 놓치는 비율이 집단 간 유사합니다.',
};

const FAIRNESS_STATUS_LABEL: Record<FairlearnStatus, string> = {
  PASS: '정상',
  REVIEW: '추가검토',
  FAIL: '기준초과',
};

const FAIRNESS_STATUS_VARIANT: Record<FairlearnStatus, 'good' | 'warn' | 'bad'> = {
  PASS: 'good',
  REVIEW: 'warn',
  FAIL: 'bad',
};

interface AuditResultsSectionProps {
  auditId: number;
}

function AuditResultsSection({ auditId }: AuditResultsSectionProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shapMetrics, setShapMetrics] = useState<ShapMetricItem[]>([]);
  const [fairnessResults, setFairnessResults] = useState<FairlearnResultItem[]>([]);

  // auditId가 바뀌면(다른 감사의 결과 페이지로 바로 이동) 이전 감사의 결과가 잠시
  // 남아있지 않도록 렌더링 중에 바로 리셋한다.
  const [selectedDeliverables, setSelectedDeliverables] = useState<Set<string>>(
    () => getSelectedDeliverables(auditId) ?? new Set(DEFAULT_SELECTED_DELIVERABLES),
  );

  const [prevAuditId, setPrevAuditId] = useState(auditId);
  if (auditId !== prevAuditId) {
    setPrevAuditId(auditId);
    setIsLoading(true);
    setLoadError(null);
    setShapMetrics([]);
    setFairnessResults([]);
    setSelectedDeliverables(getSelectedDeliverables(auditId) ?? new Set(DEFAULT_SELECTED_DELIVERABLES));
  }

  useEffect(() => {
    let cancelled = false;

    Promise.all([getExplainability(auditId), getFairness(auditId)])
      .then(([explainability, fairness]) => {
        if (cancelled) return;
        // 민감변수 기여비율은 별도 화면(대시보드 상세보기의 TOP5 카드)에서 다루므로
        // 이 페이지의 SHAP 지표 목록에서는 제외한다.
        setShapMetrics(
          explainability.metrics.filter((metric) => metric.metricCode !== 'SENSITIVE_CONTRIB'),
        );
        setFairnessResults(fairness.results);
      })
      .catch(() => {
        if (!cancelled) setLoadError('감사 결과를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [auditId]);

  const fairnessGroups = useMemo(
    () => groupFairnessByAttribute(fairnessResults),
    [fairnessResults],
  );

  const selectedDeliverableCount = selectedDeliverables.size;

  const toggleDeliverable = (id: string) => {
    setSelectedDeliverables((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      persistSelectedDeliverables(auditId, next);
      return next;
    });
  };

  return (
    <div className="audit-execution-section">
      <StepIndicator doneSteps={[1, 2, 3]} activeSteps={[4]} />

      {isLoading ? (
        <div className="audit-execution-section__loading" role="status" aria-live="polite">
          <span className="audit-execution-section__spinner" aria-hidden="true" />
          <p className="audit-execution-section__loading-text">
            감사 결과를 불러오고 있습니다. 잠시만 기다려주세요.
          </p>
        </div>
      ) : loadError ? (
        <p className="audit-execution-section__empty" role="alert">
          {loadError}
        </p>
      ) : (
        <>
          <section className="audit-execution-section__result-card">
            <h2 className="audit-execution-section__result-title">
              STEP 2 결과 — 설명가능성 3지표
            </h2>

            {shapMetrics.length === 0 ? (
              <p className="audit-execution-section__empty">SHAP 분석 결과가 없습니다.</p>
            ) : (
              <div className="audit-execution-section__stat-grid">
                {shapMetrics.map((metric) => (
                  <div key={metric.metricCode} className="audit-execution-section__stat">
                    <p className="audit-execution-section__stat-label">
                      {SHAP_METRIC_LABEL[metric.metricCode]}
                      <MetricHelpTooltip
                        label={SHAP_METRIC_LABEL[metric.metricCode]}
                        description={SHAP_METRIC_HELP[metric.metricCode]}
                        tip={SHAP_METRIC_TIP[metric.metricCode]}
                      />
                    </p>
                    <div className="audit-execution-section__fairness-row">
                      <p className="audit-execution-section__stat-value">{metric.value}</p>
                      <span
                        className={`audit-execution-section__fairness-status audit-execution-section__fairness-status--${SHAP_STATUS_VARIANT[metric.status]}`}
                      >
                        {SHAP_STATUS_LABEL[metric.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="audit-execution-section__result-card">
            <h2 className="audit-execution-section__result-title">
              STEP 3 결과 — Fairlearn 공정성{' '}
              <span className="audit-execution-section__result-note">
                (편향은 확정이 아닌 추가검토 신호)
              </span>
            </h2>
            {fairnessGroups.length === 0 ? (
              <p className="audit-execution-section__empty">Fairlearn 감사 결과가 없습니다.</p>
            ) : (
              fairnessGroups.map(([attribute, metrics]) => (
                <div key={attribute} className="audit-execution-section__fairness-group">
                  <p className="audit-execution-section__fairness-group-title">
                    {FAIRNESS_ATTRIBUTE_LABEL[attribute] ?? attribute}
                  </p>
                  {metrics[0]?.note && (
                    <p className="audit-execution-section__fairness-note">{metrics[0].note}</p>
                  )}
                  <div className="audit-execution-section__stat-grid">
                    {metrics.map((metric) => (
                      <div key={metric.metricCode} className="audit-execution-section__stat">
                        <p className="audit-execution-section__stat-label">
                          {FAIRNESS_METRIC_LABEL[metric.metricCode]}
                          <MetricHelpTooltip
                            label={FAIRNESS_METRIC_LABEL[metric.metricCode]}
                            description={FAIRNESS_METRIC_HELP[metric.metricCode]}
                            tip={FAIRNESS_METRIC_TIP[metric.metricCode]}
                          />
                        </p>
                        <div className="audit-execution-section__fairness-row">
                          <p className="audit-execution-section__stat-value">{metric.value}</p>
                          <span
                            className={`audit-execution-section__fairness-status-text audit-execution-section__fairness-status-text--${FAIRNESS_STATUS_VARIANT[metric.status]}`}
                          >
                            {FAIRNESS_STATUS_LABEL[metric.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="audit-execution-section__deliverables">
            <h2 className="audit-execution-section__result-title">산출물 선택</h2>

            <div className="audit-execution-section__deliverable-grid">
              {DELIVERABLES.map((deliverable) => {
                const selected = selectedDeliverables.has(deliverable.id);

                return (
                  <button
                    key={deliverable.id}
                    type="button"
                    className={`audit-execution-section__deliverable-card${selected ? ' audit-execution-section__deliverable-card--selected' : ''}`}
                    onClick={() => toggleDeliverable(deliverable.id)}
                  >
                    <span className="audit-execution-section__deliverable-file" aria-hidden="true">
                      <DocumentIcon />
                    </span>
                    <span className="audit-execution-section__deliverable-label">
                      {deliverable.label}
                    </span>
                    <span
                      className={`audit-execution-section__deliverable-check${selected ? ' audit-execution-section__deliverable-check--on' : ''}`}
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="audit-execution-section__deliverable-summary">
              <p className="audit-execution-section__deliverable-summary-count">
                {selectedDeliverableCount}/{DELIVERABLES.length}개 선택하셨습니다.
              </p>
              <p className="audit-execution-section__deliverable-summary-note">
                추후에 모니터링 페이지에서 재선택할 수 있습니다.
              </p>
            </div>

            <div className="audit-execution-section__generate-bar">
              <button
                type="button"
                className="audit-execution-section__generate-button"
                onClick={() => {
                  // 상세 페이지로 넘어가면 이 감사는 더 이상 "진행중"이 아니므로
                  // 홈 화면 진행중 감사 목록에서도 빠진다.
                  markAuditResultsViewed(auditId);
                  navigate(`/dashboard/${auditId}`);
                }}
              >
                감사 상세보기 →
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default AuditResultsSection;
