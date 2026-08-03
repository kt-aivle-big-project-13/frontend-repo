import type {
  FairnessMetricCode,
  FairnessMetricDistribution,
} from '../../../../features/dashboard/api/dashboardApi';

import './FairnessDistributionSection.css';

interface FairnessDistributionSectionProps {
  metrics: FairnessMetricDistribution[];
}

const METRIC_LABELS: Record<FairnessMetricCode, string> = {
  DEMOGRAPHIC_PARITY: 'Demographic Parity · 인구통계학적 동등성',
  EQUAL_OPPORTUNITY: 'Equal Opportunity · 기회균등',
  EQUALIZED_ODDS: 'Equalized Odds · 균등화 승산',
  PROPORTIONAL_PARITY: 'Proportional Parity · 비례적 동등성',
  FPR_PARITY: 'FPR Parity · 거짓 양성률 동등성',
  FDR_PARITY: 'FDR Parity · 거짓 발견률 동등성',
  FOR_PARITY: 'FOR Parity · 거짓 누락률 동등성',
};

const SEGMENTS = [
  { key: 'passRate', label: '정상', tone: 'pass' },
  { key: 'reviewRate', label: '검토', tone: 'review' },
  { key: 'failRate', label: '실패', tone: 'fail' },
  { key: 'unavailableRate', label: '결과 없음', tone: 'unavailable' },
] as const;

function FairnessDistributionSection({ metrics }: FairnessDistributionSectionProps) {
  return (
    <section className="fairness-distribution">
      <div className="fairness-distribution__header">
        <h2 className="fairness-distribution__title">공정성 7개 지표 판정 분포</h2>
        <ul className="fairness-distribution__legend" aria-label="판정 범례">
          {SEGMENTS.map((segment) => (
            <li key={segment.key}>
              <span
                className={`fairness-distribution__legend-dot fairness-distribution__legend-dot--${segment.tone}`}
              />
              {segment.label}
            </li>
          ))}
        </ul>
      </div>

      {metrics.length > 0 ? (
        <div className="fairness-distribution__list">
          {metrics.map((metric) => (
            <div key={metric.metricCode} className="fairness-distribution__item">
              <div className="fairness-distribution__metric-name">
                {METRIC_LABELS[metric.metricCode]}
              </div>
              <div
                className="fairness-distribution__bar"
                aria-label={`${METRIC_LABELS[metric.metricCode]}: 정상 ${metric.passRate}%, 검토 ${metric.reviewRate}%, 실패 ${metric.failRate}%, 결과 없음 ${metric.unavailableRate}%`}
              >
                {SEGMENTS.map((segment) => {
                  const rate = metric[segment.key];

                  return (
                    <span
                      key={segment.key}
                      className={`fairness-distribution__segment fairness-distribution__segment--${segment.tone}`}
                      style={{ width: `${rate}%` }}
                      title={`${segment.label} ${rate.toFixed(1)}%`}
                    >
                      {rate >= 8 ? `${rate.toFixed(1)}%` : ''}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="fairness-distribution__empty">공정성 분석 결과가 없습니다.</div>
      )}

      <p className="fairness-distribution__note">
        모델별 민감속성 영향과 관계없이 지표 코드·판정 상태를 기준으로 집계한 결과입니다.
      </p>
    </section>
  );
}

export default FairnessDistributionSection;
