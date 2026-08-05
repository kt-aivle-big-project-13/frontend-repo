import type {
  AuditSummary,
  ExplainabilityResponse,
  FairnessResponse,
} from '../../../../features/audit/api/auditApi';

import {
  buildStatusDistribution,
  compareByLabel,
  DEFAULT_STATUS_COLOR,
  formatDelta,
  STATUS_COLOR,
  TREND_COLOR,
  TREND_ICON,
  TREND_LABEL,
  type ComparisonTrend,
  type StatusDistribution,
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

// 모델 상세(결과) 페이지의 "지표 판정 분포" 게이지와 동일한 도넛 SVG — 두 버전을 나란히
// 그려서 색만 봐도 전체 판정 비중이 어떻게 바뀌었는지 보이게 한다.
const GAUGE_RADIUS = 40;
const GAUGE_STROKE_WIDTH = 12;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

function statusColor(label: string | null): { text: string; bg: string } {
  if (!label) return DEFAULT_STATUS_COLOR;
  return STATUS_COLOR[label] ?? DEFAULT_STATUS_COLOR;
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

// TOP5 순위 변동은 "충족/주의/추가검토" 판정이 아니라 등수 자체가 오르내리는 것이라 TREND_LABEL
// (개선/악화/…/신규 계산)의 문구가 그대로는 안 맞는다 — "신규 계산" 대신 "신규 진입"처럼
// 순위 맥락에 맞는 문구만 따로 쓰고, 아이콘·색은 TrendBadge와 동일한 걸 재사용한다.
const RANK_TREND_LABEL: Record<ComparisonTrend, string> = {
  improved: '순위 상승',
  worsened: '순위 하락',
  same: '순위 동일',
  new: '신규 진입',
  removed: '이탈',
  unavailable: '비교 불가',
};

function RankTrendBadge({ trend }: { trend: ComparisonTrend }) {
  return (
    <span
      className="audit-compare-section__trend"
      style={{ color: TREND_COLOR[trend], borderColor: TREND_COLOR[trend] }}
    >
      <span aria-hidden="true">{TREND_ICON[trend]}</span>
      {RANK_TREND_LABEL[trend]}
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

function DistributionDonut({ label, distribution }: { label: string; distribution: StatusDistribution }) {
  const segments = [
    { key: '충족', count: distribution.pass, color: STATUS_COLOR.충족.text },
    { key: '주의', count: distribution.warning, color: STATUS_COLOR.주의.text },
    { key: '추가검토', count: distribution.review, color: STATUS_COLOR.추가검토.text },
    { key: '계산불가', count: distribution.na, color: STATUS_COLOR.계산불가.text },
  ];
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  const passRatio = total === 0 ? 0 : Math.round((distribution.pass / total) * 100);
  let offset = 0;

  return (
    <div className="audit-compare-section__donut-wrap">
      <svg viewBox="0 0 100 100" className="audit-compare-section__donut">
        <circle
          cx="50"
          cy="50"
          r={GAUGE_RADIUS}
          fill="none"
          stroke="#eef0f3"
          strokeWidth={GAUGE_STROKE_WIDTH}
        />
        {total > 0 &&
          segments
            .filter((segment) => segment.count > 0)
            .map((segment) => {
              const arcLength = (segment.count / total) * GAUGE_CIRCUMFERENCE;
              const dashOffset = -offset;
              offset += arcLength;

              return (
                <circle
                  key={segment.key}
                  cx="50"
                  cy="50"
                  r={GAUGE_RADIUS}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={GAUGE_STROKE_WIDTH}
                  strokeDasharray={`${arcLength} ${GAUGE_CIRCUMFERENCE - arcLength}`}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 50 50)"
                />
              );
            })}
        <text x="50" y="54" textAnchor="middle" className="audit-compare-section__donut-value">
          {passRatio}%
        </text>
        <text x="50" y="68" textAnchor="middle" className="audit-compare-section__donut-caption">
          충족
        </text>
      </svg>
      <span className="audit-compare-section__donut-label">{label}</span>
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
      <td className="audit-compare-section__cell-label">
        <span
          className="audit-compare-section__dot"
          style={{ backgroundColor: statusColor(label).text }}
        />
        {label}
      </td>
      <td className="audit-compare-section__cell-value">{previous}개</td>
      <td className="audit-compare-section__cell-value">{latest}개</td>
      <td className="audit-compare-section__cell-value" style={{ color: deltaColor }}>
        {formatDelta(previous, latest)}
      </td>
    </tr>
  );
}

// SHAP·Fairlearn 값 옆에 붙는 가로 막대 — 두 버전의 크기를 눈으로 바로 비교할 수 있게 한다.
// 값 자체가 아니라 색은 판정(충족/주의/추가검토)을 따른다 — 지표마다 "커야 좋은지 작아야
// 좋은지"가 달라서 막대 길이만으로 좋고 나쁨을 판단하면 안 되기 때문이다.
function ValueBar({ value, label }: { value: number | null; label: string | null }) {
  const color = statusColor(label).text;
  const width = value == null ? 0 : Math.min(Math.max(value, 0), 1) * 100;

  return (
    <div className="audit-compare-section__value-bar">
      <div className="audit-compare-section__value-bar-track">
        <div
          className="audit-compare-section__value-bar-fill"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <span className="audit-compare-section__value-bar-text">
        {value != null ? value.toFixed(4) : '—'}
        {label ? ` (${label})` : ''}
      </span>
    </div>
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
  const maxFeatureValue = Math.max(...latestTopFeatures.map((item) => item.value ?? 0), 0.0001);

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

        <div className="audit-compare-section__donut-row">
          <DistributionDonut label="이전 버전" distribution={previousDistribution} />
          <DistributionDonut label="최신 버전" distribution={latestDistribution} />
        </div>

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
        <div className="audit-compare-section__shap-list">
          {shapMetricCodes.map((code) => {
            const previousMetric = previousShap.find((m) => m.metricCode === code);
            const latestMetric = latestShap.find((m) => m.metricCode === code);
            const previousLabel = previousMetric ? SHAP_STATUS_LABEL[previousMetric.status] : null;
            const latestLabel = latestMetric ? SHAP_STATUS_LABEL[latestMetric.status] : null;
            const trend = compareByLabel(previousLabel, latestLabel);

            return (
              <div key={code} className="audit-compare-section__shap-row">
                <div className="audit-compare-section__shap-row-header">
                  <span className="audit-compare-section__cell-label">{SHAP_METRIC_LABEL[code]}</span>
                  <TrendBadge trend={trend} />
                </div>
                <div className="audit-compare-section__bar-line">
                  <span className="audit-compare-section__bar-caption">이전</span>
                  <ValueBar value={previousMetric?.value ?? null} label={previousLabel} />
                </div>
                <div className="audit-compare-section__bar-line">
                  <span className="audit-compare-section__bar-caption">최신</span>
                  <ValueBar value={latestMetric?.value ?? null} label={latestLabel} />
                </div>
              </div>
            );
          })}
        </div>
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
                    <td
                      className="audit-compare-section__cell-value audit-compare-section__cell-value--bar"
                      style={{ backgroundColor: statusColor(previousLabel).bg }}
                    >
                      <ValueBar value={previousCell?.value ?? null} label={previousLabel} />
                    </td>
                    <td
                      className="audit-compare-section__cell-value audit-compare-section__cell-value--bar"
                      style={{ backgroundColor: statusColor(latestLabel).bg }}
                    >
                      <ValueBar value={latestCell?.value ?? null} label={latestLabel} />
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
          <ul className="audit-compare-section__feature-list">
            {latestTopFeatures.map((item) => {
              const previousRank = previousRankByFeature.get(item.feature) ?? null;
              const koreanLabel = getFeatureLabel(item.feature) ?? item.feature;
              const rankDelta = previousRank == null ? null : previousRank - item.rank;
              const rankTrend: ComparisonTrend =
                rankDelta == null ? 'new' : rankDelta > 0 ? 'improved' : rankDelta < 0 ? 'worsened' : 'same';

              return (
                <li key={item.feature} className="audit-compare-section__feature-row">
                  <span className="audit-compare-section__feature-rank">{item.rank}위</span>
                  <span className="audit-compare-section__cell-label audit-compare-section__feature-name">
                    {koreanLabel}
                  </span>
                  <div className="audit-compare-section__bar-track audit-compare-section__feature-bar-track">
                    <div
                      className="audit-compare-section__bar-fill"
                      style={{ width: `${((item.value ?? 0) / maxFeatureValue) * 100}%` }}
                    />
                  </div>
                  <span className="audit-compare-section__cell-value audit-compare-section__feature-value">
                    {item.value != null ? item.value.toFixed(3) : '—'}
                  </span>
                  <span className="audit-compare-section__feature-prev">
                    {previousRank != null ? `이전 ${previousRank}위` : '신규'}
                  </span>
                  <RankTrendBadge trend={rankTrend} />
                </li>
              );
            })}
          </ul>
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
