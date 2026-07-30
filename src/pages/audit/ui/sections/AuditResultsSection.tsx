import { useEffect, useMemo, useState } from 'react';

import {
  getFairness,
  getExplainability,
  type FairlearnResultItem,
  type ShapMetricItem,
} from '../../../../features/audit/api/auditApi';
import StepIndicator from '../StepIndicator';

import './AuditFlow.css';

interface Deliverable {
  id: string;
  label: string;
  fileType: 'PDF' | 'Word';
}

const DELIVERABLES: Deliverable[] = [
  { id: 'high-impact-ai', label: '고영향 AI 사전진단', fileType: 'PDF' },
  { id: 'shap-report', label: '설명가능성 리포트 (SHAP)', fileType: 'PDF' },
  { id: 'fairness-report', label: '편향 진단 보고서 (Fairlearn)', fileType: 'PDF' },
  { id: 'compliance-verdict', label: '규제준수 판정서', fileType: 'PDF' },
  { id: 'improvement-guide', label: '개선 권고 가이드', fileType: 'Word' },
];

const DEFAULT_SELECTED_DELIVERABLES = new Set<string>();

type ShapMetricCode = ShapMetricItem['metricCode'];
type ShapStatus = ShapMetricItem['status'];

const SHAP_METRIC_LABEL: Record<ShapMetricCode, string> = {
  SENSITIVE_CONTRIB: '민감변수 기여비율 (SENSITIVE_CONTRIB)',
  GLOBAL_STABILITY: '설명 일관성 (GLOBAL_STABILITY)',
  FIDELITY: '설명 충실성 (FIDELITY)',
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shapMetrics, setShapMetrics] = useState<ShapMetricItem[]>([]);
  const [fairnessResults, setFairnessResults] = useState<FairlearnResultItem[]>([]);

  // auditId가 바뀌면(다른 감사의 결과 페이지로 바로 이동) 이전 감사의 결과가 잠시
  // 남아있지 않도록 렌더링 중에 바로 리셋한다.
  const [prevAuditId, setPrevAuditId] = useState(auditId);
  if (auditId !== prevAuditId) {
    setPrevAuditId(auditId);
    setIsLoading(true);
    setLoadError(null);
    setShapMetrics([]);
    setFairnessResults([]);
  }

  const [selectedDeliverables, setSelectedDeliverables] = useState<Set<string>>(
    () => new Set(DEFAULT_SELECTED_DELIVERABLES),
  );

  useEffect(() => {
    let cancelled = false;

    Promise.all([getExplainability(auditId), getFairness(auditId)])
      .then(([explainability, fairness]) => {
        if (cancelled) return;
        setShapMetrics(explainability.metrics);
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
      return next;
    });
  };

  return (
    <div className="audit-execution-section">
      <StepIndicator doneSteps={[1, 2, 3]} activeSteps={[4]} />

      {isLoading ? (
        <div
          className="audit-execution-section__loading"
          role="status"
          aria-live="polite"
        >
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
              <p className="audit-execution-section__empty">
                SHAP 분석 결과가 없습니다.
              </p>
            ) : (
              <div className="audit-execution-section__stat-grid">
                {shapMetrics.map((metric) => (
                  <div key={metric.metricCode} className="audit-execution-section__stat">
                    <p className="audit-execution-section__stat-label">
                      {SHAP_METRIC_LABEL[metric.metricCode]}
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
              <p className="audit-execution-section__empty">
                Fairlearn 감사 결과가 없습니다.
              </p>
            ) : (
              fairnessGroups.map(([attribute, metrics]) => (
                <div key={attribute} className="audit-execution-section__fairness-group">
                  <p className="audit-execution-section__fairness-group-title">
                    {FAIRNESS_ATTRIBUTE_LABEL[attribute] ?? attribute}
                  </p>
                  {metrics[0]?.note && (
                    <p className="audit-execution-section__fairness-note">
                      {metrics[0].note}
                    </p>
                  )}
                  <div className="audit-execution-section__stat-grid">
                    {metrics.map((metric) => (
                      <div
                        key={metric.metricCode}
                        className="audit-execution-section__stat"
                      >
                        <p className="audit-execution-section__stat-label">
                          {FAIRNESS_METRIC_LABEL[metric.metricCode]}
                        </p>
                        <div className="audit-execution-section__fairness-row">
                          <p className="audit-execution-section__stat-value">
                            {metric.value}
                          </p>
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
                    <span
                      className={`audit-execution-section__deliverable-file audit-execution-section__deliverable-file--${deliverable.fileType.toLowerCase()}`}
                    >
                      {deliverable.fileType}
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
                disabled={selectedDeliverableCount === 0}
              >
                보고서 생성 →
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default AuditResultsSection;