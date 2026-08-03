import type { ShapMetricItem } from '../../../../features/audit/api/auditApi';
import MetricHelpTooltip from '../../../../features/audit/ui/MetricHelpTooltip';

import {
  SHAP_METRIC_HELP,
  SHAP_METRIC_LABEL,
  SHAP_METRIC_RANGE,
  SHAP_METRIC_TIP,
  SHAP_STATUS_LABEL,
} from './shapData';
import './ExplainabilityCard.css';

interface ExplainabilityCardProps {
  metrics: ShapMetricItem[];
  isLoading: boolean;
  error: string | null;
}

function ExplainabilityCard({ metrics, isLoading, error }: ExplainabilityCardProps) {
  return (
    <section className="explainability-card">
      <h2 className="explainability-card__title">SHAP 설명가능성</h2>

      {isLoading ? (
        <p className="explainability-card__status">불러오는 중…</p>
      ) : error ? (
        <p className="explainability-card__status explainability-card__status--error">
          {error}
        </p>
      ) : metrics.length === 0 ? (
        <p className="explainability-card__status">SHAP 분석 결과가 없습니다.</p>
      ) : (
        <div className="explainability-card__list">
          {metrics.map((metric) => (
            <div key={metric.metricCode} className="explainability-card__row">
              <div className="explainability-card__row-header">
                <span className="explainability-card__label">
                  {SHAP_METRIC_LABEL[metric.metricCode] ?? metric.metricCode}
                  <MetricHelpTooltip
                    label={SHAP_METRIC_LABEL[metric.metricCode] ?? metric.metricCode}
                    description={SHAP_METRIC_HELP[metric.metricCode] ?? ''}
                    tip={SHAP_METRIC_TIP[metric.metricCode] ?? ''}
                  />
                </span>
                <span
                  className={`explainability-card__badge explainability-card__badge--${metric.status.toLowerCase()}`}
                >
                  {SHAP_STATUS_LABEL[metric.status]}
                </span>
              </div>

              <div className="explainability-card__value-row">
                <span className="explainability-card__value">{metric.value}</span>
                <span className="explainability-card__range">
                  {SHAP_METRIC_RANGE[metric.metricCode] ?? `기준 ${metric.threshold}`}
                </span>
              </div>

              <div className="explainability-card__bar-track">
                <div
                  className={`explainability-card__bar-fill explainability-card__bar-fill--${metric.status.toLowerCase()}`}
                  style={{ width: `${Math.min(metric.value, 1) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ExplainabilityCard;