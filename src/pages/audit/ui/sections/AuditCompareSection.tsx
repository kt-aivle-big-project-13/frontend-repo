import type {
  AuditSummary,
  ExplainabilityResponse,
  FairnessResponse,
} from '../../../../features/audit/api/auditApi';

import {
  buildStatusDistribution,
  compareByLabel,
  formatDelta,
  TREND_COLOR,
  TREND_ICON,
  TREND_LABEL,
  type ComparisonTrend,
} from './compareData';
import { formatAuditDate, STATUS_BG_COLOR, STATUS_LABEL, STATUS_TEXT_COLOR } from './auditStatusMeta';
import { getFeatureLabel } from './featureData';
import {
  ATTRIBUTE_LABEL,
  COLUMN_LABEL,
  COLUMN_ORDER,
  FAIRNESS_STATUS_LABEL,
  getFairnessStatusCounts,
  groupByAttribute,
} from './fairnessData';
import { getShapStatusCounts, SHAP_METRIC_LABEL, SHAP_STATUS_LABEL } from './shapData';
import './AuditCompareSection.css';

interface AuditCompareSectionProps {
  previousSummary: AuditSummary;
  latestSummary: AuditSummary;
  previousExplainability: ExplainabilityResponse | null;
  latestExplainability: ExplainabilityResponse | null;
  previousFairness: FairnessResponse | null;
  latestFairness: FairnessResponse | null;
  previousDataError: boolean;
  latestDataError: boolean;
}

function TrendBadge({ trend }: { trend: ComparisonTrend }) {
  return (
    <span
      className="audit-compare-section__trend"
      style={{ color: TREND_COLOR[trend], borderColor: TREND_COLOR[trend] }}
    >
      <span aria-hidden="true">{TREND_ICON[trend]}</span>
      {TREND_LABEL[trend]}
    </span>
  );
}

function VersionColumnHeader({ label, summary }: { label: string; summary: AuditSummary }) {
  return (
    <div className="audit-compare-section__version-col">
      <span className="audit-compare-section__version-label">{label}</span>
      <span className="audit-compare-section__version-tag">{summary.version ?? '—'}</span>
      <span className="audit-compare-section__version-date">{formatAuditDate(summary.completedAt)}</span>
      <span
        className="audit-compare-section__version-status"
        style={{ backgroundColor: STATUS_BG_COLOR[summary.status], color: STATUS_TEXT_COLOR[summary.status] }}
      >
        {STATUS_LABEL[summary.status]}
      </span>
    </div>
  );
}

function DistributionRow({
  label,
  previous,
  latest,
}: {
  label: string;
  previous: number;
  latest: number;
}) {
  const delta = latest - previous;
  const deltaColor = delta > 0 ? '#1b9851' : delta < 0 ? '#d93e44' : '#6b7684';

  return (
    <tr>
      <td className="audit-compare-section__cell-label">{label}</td>
      <td className="audit-compare-section__cell-value">{previous}개</td>
      <td className="audit-compare-section__cell-value">{latest}개</td>
      <td className="audit-compare-section__cell-value" style={{ color: deltaColor }}>
        {formatDelta(previous, latest)}
      </td>
    </tr>
  );
}

function AuditCompareSection({
  previousSummary,
  latestSummary,
  previousExplainability,
  latestExplainability,
  previousFairness,
  latestFairness,
  previousDataError,
  latestDataError,
}: AuditCompareSectionProps) {
  if (previousDataError || latestDataError) {
    return (
      <section className="audit-compare-section">
        <p className="audit-compare-section__empty" role="alert">
          {previousDataError && latestDataError
            ? '두 버전 모두 분석 결과를 불러오지 못했습니다.'
            : previousDataError
              ? '이전 버전의 분석 결과를 불러오지 못했습니다.'
              : '최신 버전의 분석 결과를 불러오지 못했습니다.'}
        </p>
      </section>
    );
  }

  const previousShap =
    previousExplainability?.metrics.filter((m) => m.metricCode !== 'SENSITIVE_CONTRIB') ?? [];
  const latestShap =
    latestExplainability?.metrics.filter((m) => m.metricCode !== 'SENSITIVE_CONTRIB') ?? [];

  const previousFairnessResults = previousFairness?.results ?? [];
  const latestFairnessResults = latestFairness?.results ?? [];

  const previousDistribution = buildStatusDistribution(
    getShapStatusCounts(previousShap),
    getFairnessStatusCounts(previousFairnessResults),
  );
  const latestDistribution = buildStatusDistribution(
    getShapStatusCounts(latestShap),
    getFairnessStatusCounts(latestFairnessResults),
  );

  const shapMetricCodes = ['GLOBAL_STABILITY', 'FIDELITY'] as const;

  const previousFairnessGrouped = groupByAttribute(previousFairnessResults);
  const latestFairnessGrouped = groupByAttribute(latestFairnessResults);

  const previousTopFeatures = previousExplainability?.topFeatures ?? [];
  const latestTopFeatures = latestExplainability?.topFeatures ?? [];
  const previousRankByFeature = new Map(previousTopFeatures.map((item) => [item.feature, item.rank]));
  const droppedFeatures = previousTopFeatures.filter(
    (item) => !latestTopFeatures.some((latestItem) => latestItem.feature === item.feature),
  );

  return (
    <section className="audit-compare-section">
      <div className="audit-compare-section__header">
        <span className="audit-compare-section__header-model">{latestSummary.modelName}</span>
        <div className="audit-compare-section__header-versions">
          <VersionColumnHeader label="이전 버전" summary={previousSummary} />
          <span className="audit-compare-section__header-arrow" aria-hidden="true">→</span>
          <VersionColumnHeader label="최신 버전" summary={latestSummary} />
        </div>
      </div>

      <div className="audit-compare-section__block">
        <h3 className="audit-compare-section__block-title">지표 판정 분포</h3>
        <table className="audit-compare-section__table">
          <thead>
            <tr>
              <th>판정</th>
              <th>이전 버전</th>
              <th>최신 버전</th>
              <th>변화</th>
            </tr>
          </thead>
          <tbody>
            <DistributionRow label="충족" previous={previousDistribution.pass} latest={latestDistribution.pass} />
            <DistributionRow label="주의" previous={previousDistribution.warning} latest={latestDistribution.warning} />
            <DistributionRow
              label="추가검토"
              previous={previousDistribution.review}
              latest={latestDistribution.review}
            />
            <DistributionRow label="계산불가" previous={previousDistribution.na} latest={latestDistribution.na} />
          </tbody>
        </table>
      </div>

      <div className="audit-compare-section__block">
        <h3 className="audit-compare-section__block-title">설명가능성(SHAP) 지표</h3>
        <table className="audit-compare-section__table">
          <thead>
            <tr>
              <th>지표</th>
              <th>이전 버전</th>
              <th>최신 버전</th>
              <th>변화</th>
            </tr>
          </thead>
          <tbody>
            {shapMetricCodes.map((code) => {
              const previousMetric = previousShap.find((m) => m.metricCode === code);
              const latestMetric = latestShap.find((m) => m.metricCode === code);
              const previousLabel = previousMetric ? SHAP_STATUS_LABEL[previousMetric.status] : null;
              const latestLabel = latestMetric ? SHAP_STATUS_LABEL[latestMetric.status] : null;
              const trend = compareByLabel(previousLabel, latestLabel);

              return (
                <tr key={code}>
                  <td className="audit-compare-section__cell-label">{SHAP_METRIC_LABEL[code]}</td>
                  <td className="audit-compare-section__cell-value">
                    {previousMetric ? `${previousMetric.value.toFixed(3)} (${previousLabel})` : '—'}
                  </td>
                  <td className="audit-compare-section__cell-value">
                    {latestMetric ? `${latestMetric.value.toFixed(3)} (${latestLabel})` : '—'}
                  </td>
                  <td>
                    <TrendBadge trend={trend} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="audit-compare-section__block">
        <h3 className="audit-compare-section__block-title">Fairlearn 공정성 지표</h3>
        <table className="audit-compare-section__table audit-compare-section__table--fairness">
          <thead>
            <tr>
              <th>민감변수</th>
              <th>지표</th>
              <th>이전 버전</th>
              <th>최신 버전</th>
              <th>변화</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(ATTRIBUTE_LABEL).map((attribute) =>
              COLUMN_ORDER.map((code, index) => {
                const previousCell = previousFairnessGrouped.get(attribute)?.get(code);
                const latestCell = latestFairnessGrouped.get(attribute)?.get(code);
                const previousLabel = previousCell ? FAIRNESS_STATUS_LABEL[previousCell.status] : null;
                const latestLabel = latestCell ? FAIRNESS_STATUS_LABEL[latestCell.status] : null;
                const trend = compareByLabel(previousLabel, latestLabel);

                return (
                  <tr key={`${attribute}-${code}`}>
                    {index === 0 && (
                      <td
                        className="audit-compare-section__cell-label"
                        rowSpan={COLUMN_ORDER.length}
                      >
                        {ATTRIBUTE_LABEL[attribute] ?? attribute}
                      </td>
                    )}
                    <td className="audit-compare-section__cell-label">{COLUMN_LABEL[code]}</td>
                    <td className="audit-compare-section__cell-value">
                      {previousCell ? `${previousCell.value} (${previousLabel})` : '계산불가'}
                    </td>
                    <td className="audit-compare-section__cell-value">
                      {latestCell ? `${latestCell.value} (${latestLabel})` : '계산불가'}
                    </td>
                    <td>
                      <TrendBadge trend={trend} />
                    </td>
                  </tr>
                );
              }),
            )}
          </tbody>
        </table>
      </div>

      <div className="audit-compare-section__block">
        <h3 className="audit-compare-section__block-title">예측 영향 변수 TOP 5 변동</h3>
        {latestTopFeatures.length === 0 ? (
          <p className="audit-compare-section__empty">최신 버전의 피처 중요도 결과가 없습니다.</p>
        ) : (
          <table className="audit-compare-section__table">
            <thead>
              <tr>
                <th>최신 순위</th>
                <th>변수</th>
                <th>이전 순위</th>
                <th>변화</th>
              </tr>
            </thead>
            <tbody>
              {latestTopFeatures.map((item) => {
                const previousRank = previousRankByFeature.get(item.feature) ?? null;
                const koreanLabel = getFeatureLabel(item.feature) ?? item.feature;
                const rankDelta = previousRank == null ? null : previousRank - item.rank;

                return (
                  <tr key={item.feature}>
                    <td className="audit-compare-section__cell-value">{item.rank}위</td>
                    <td className="audit-compare-section__cell-label">{koreanLabel}</td>
                    <td className="audit-compare-section__cell-value">
                      {previousRank != null ? `${previousRank}위` : '—'}
                    </td>
                    <td className="audit-compare-section__cell-value">
                      {rankDelta == null
                        ? 'TOP5 신규 진입'
                        : rankDelta === 0
                          ? '순위 동일'
                          : rankDelta > 0
                            ? `${rankDelta}단계 상승`
                            : `${Math.abs(rankDelta)}단계 하락`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {droppedFeatures.length > 0 && (
          <p className="audit-compare-section__dropped">
            TOP5에서 빠진 변수:{' '}
            {droppedFeatures
              .map((item) => getFeatureLabel(item.feature) ?? item.feature)
              .join(', ')}
          </p>
        )}
      </div>
    </section>
  );
}

export default AuditCompareSection;
