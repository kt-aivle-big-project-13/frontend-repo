import type {
  AuditResultDistribution,
  ReviewRequiredModel,
} from '../../../../features/dashboard/api/dashboardApi';
import { formatModelVersion } from '../../../../features/dashboard/lib/formatModelVersion';

import './DashboardOverviewSection.css';

interface DashboardOverviewSectionProps {
  distribution: AuditResultDistribution;
  models: ReviewRequiredModel[];
}

function percentage(value: number, total: number) {
  return total > 0 ? (value / total) * 100 : 0;
}

function DashboardOverviewSection({ distribution, models }: DashboardOverviewSectionProps) {
  const normalRate = percentage(distribution.normalCount, distribution.totalCount);
  const reviewRate = percentage(distribution.reviewRequiredCount, distribution.totalCount);
  const normalEnd = normalRate;
  const reviewEnd = normalRate + reviewRate;
  const donutBackground =
    distribution.totalCount > 0
      ? `conic-gradient(#2fac68 0% ${normalEnd}%, #f4b43d ${normalEnd}% ${reviewEnd}%, #e84d52 ${reviewEnd}% 100%)`
      : '#e8ecf1';
  const maximumIssueCount = Math.max(...models.map((model) => model.issueCount), 0);

  return (
    <section className="dashboard-overview" aria-label="감사 결과 개요">
      <article className="dashboard-overview__panel">
        <h2 className="dashboard-overview__title">감사 결과 종합</h2>

        <div className="dashboard-overview__distribution">
          <div
            className="dashboard-overview__donut"
            style={{ background: donutBackground }}
            role="img"
            aria-label={`전체 ${distribution.totalCount}건 중 충족 ${distribution.normalCount}건, 주의 ${distribution.reviewRequiredCount}건, 추가 검토 ${distribution.thresholdExceededCount}건`}
          >
            <div className="dashboard-overview__donut-center">
              <span>총</span>
              <strong>{distribution.totalCount}건</strong>
            </div>
          </div>

          <ul className="dashboard-overview__legend">
            <li>
              <span className="dashboard-overview__legend-dot dashboard-overview__legend-dot--normal" />
              <span>충족</span>
              <strong>
                {distribution.normalCount}건 ({normalRate.toFixed(1)}%)
              </strong>
            </li>
            <li>
              <span className="dashboard-overview__legend-dot dashboard-overview__legend-dot--review" />
              <span>주의</span>
              <strong>
                {distribution.reviewRequiredCount}건 ({reviewRate.toFixed(1)}%)
              </strong>
            </li>
            <li>
              <span className="dashboard-overview__legend-dot dashboard-overview__legend-dot--exceeded" />
              <span>추가 검토</span>
              <strong>
                {distribution.thresholdExceededCount}건 (
                {percentage(distribution.thresholdExceededCount, distribution.totalCount).toFixed(
                  1,
                )}
                %)
              </strong>
            </li>
          </ul>
        </div>
      </article>

      <article className="dashboard-overview__panel dashboard-overview__panel--ranking">
        <h2 className="dashboard-overview__title">주의·추가 검토 모델 TOP 5</h2>

        {models.length > 0 ? (
          <ol className="dashboard-overview__ranking-list">
            {models.map((model, index) => {
              const barWidth =
                maximumIssueCount > 0 ? (model.issueCount / maximumIssueCount) * 100 : 0;

              return (
                <li key={model.modelId} className="dashboard-overview__ranking-item">
                  <span className="dashboard-overview__rank">{index + 1}</span>
                  <span className="dashboard-overview__model-name">
                    {model.modelName}
                    {model.version && (
                      <span className="dashboard-overview__model-version">
                        {formatModelVersion(model.version)}
                      </span>
                    )}
                  </span>
                  <span className="dashboard-overview__bar-track">
                    <span
                      className={`dashboard-overview__bar dashboard-overview__bar--${model.status.toLowerCase()}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </span>
                  <strong className="dashboard-overview__issue-count">{model.issueCount}건</strong>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="dashboard-overview__empty">주의·추가 검토 모델이 없습니다.</div>
        )}
      </article>
    </section>
  );
}

export default DashboardOverviewSection;
