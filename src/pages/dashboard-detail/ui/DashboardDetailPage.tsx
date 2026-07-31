import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  getAudits,
  getExplainability,
  getFairness,
  TERMINAL_STATUSES,
  type AuditSummary,
  type FairlearnResultItem,
  type FeatureImportanceItem,
  type ShapMetricItem,
} from '../../../features/audit/api/auditApi';
import MainLayout from '../../../widgets/layout/ui/MainLayout';

import AuditHistorySection from './sections/AuditHistorySection';
import { formatAuditDate, STATUS_BG_COLOR, STATUS_LABEL, STATUS_TEXT_COLOR } from './sections/auditStatusMeta';
import ExplainabilityCard from './sections/ExplainabilityCard';
import { getFairnessStatusCounts } from './sections/fairnessData';
import FairnessTable from './sections/FairnessTable';
import ReportsSection from './sections/ReportsSection';
import { getShapStatusCounts } from './sections/shapData';
import TopFeaturesCard from './sections/TopFeaturesCard';
import './DashboardDetailPage.css';

const RECENT_HISTORY_LIMIT = 5;

// 실패(FAILED)·아직 안 끝난(PENDING/IN_PROGRESS) 감사는 "이력"에서 제외하고,
// 최근 완료된 순서대로 정렬해 최대 5건만 보여준다.
function selectRecentHistory(audits: AuditSummary[]): AuditSummary[] {
  return audits
    .filter(
      (audit) => TERMINAL_STATUSES.includes(audit.status) && audit.status !== 'FAILED',
    )
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, RECENT_HISTORY_LIMIT);
}

interface StatusSegment {
  label: string;
  count: number;
  color: string;
}

const GAUGE_RADIUS = 40;
const GAUGE_STROKE_WIDTH = 12;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

// SHAP(민감변수 기여비율 제외 2개) + Fairlearn 14개(민감변수2×지표7) 판정을 정상/주의/경고/계산불가로 집계.
// 임의로 지어낸 "종합 위험 점수"가 아니라, 실제 지표 판정 개수를 그대로 세어 비율로 보여준다.
function buildStatusSegments(
  shapMetrics: ShapMetricItem[],
  fairnessResults: FairlearnResultItem[],
): StatusSegment[] {
  const shap = getShapStatusCounts(shapMetrics);
  const fairness = getFairnessStatusCounts(fairnessResults);

  return [
    { label: '정상', count: shap.pass + fairness.pass, color: '#1b9851' },
    { label: '주의', count: shap.review + fairness.review, color: '#e09c14' },
    { label: '경고', count: fairness.fail, color: '#d93e44' },
    { label: '계산불가', count: fairness.na, color: '#c1c7d0' },
  ];
}

function StatusDonut({ segments }: { segments: StatusSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  const passRatio = total === 0 ? 0 : Math.round(((segments[0]?.count ?? 0) / total) * 100);

  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" className="dashboard-detail-page__gauge">
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
                key={segment.label}
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
      <text x="50" y="54" textAnchor="middle" className="dashboard-detail-page__gauge-value">
        {passRatio}%
      </text>
      <text x="50" y="68" textAnchor="middle" className="dashboard-detail-page__gauge-caption">
        정상
      </text>
    </svg>
  );
}

function StatusLegend({ segments }: { segments: StatusSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);

  return (
    <ul className="dashboard-detail-page__legend">
      {segments.map((segment) => (
        <li key={segment.label} className="dashboard-detail-page__legend-row">
          <span
            className="dashboard-detail-page__legend-dot"
            style={{ backgroundColor: segment.color }}
          />
          <span className="dashboard-detail-page__legend-label">{segment.label}</span>
          <span className="dashboard-detail-page__legend-value">
            {segment.count}개 ({total === 0 ? 0 : Math.round((segment.count / total) * 100)}%)
          </span>
        </li>
      ))}
    </ul>
  );
}

function DashboardDetailPage() {
  const { auditId } = useParams<{ auditId: string }>();

  const numericAuditId = Number(auditId);
  const isValidAuditId = auditId != null && !Number.isNaN(numericAuditId);

  const [shapMetrics, setShapMetrics] = useState<ShapMetricItem[]>([]);
  const [fairnessResults, setFairnessResults] = useState<FairlearnResultItem[]>([]);
  const [topFeatures, setTopFeatures] = useState<FeatureImportanceItem[]>([]);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [recentHistory, setRecentHistory] = useState<AuditSummary[]>([]);
  const [isLoading, setIsLoading] = useState(isValidAuditId);
  const [loadError, setLoadError] = useState<string | null>(
    isValidAuditId ? null : '잘못된 감사 ID입니다.',
  );

  // auditId가 바뀌면(다른 감사로 이동) 이전 결과가 잠시 남아있지 않도록 렌더링 중에 동기적으로 리셋한다.
  // (AuditExecutionSection의 prevViewAuditId 패턴과 동일 — 이펙트 안에서 곧바로 setState하지 않기 위함)
  const [prevAuditId, setPrevAuditId] = useState(auditId);
  if (auditId !== prevAuditId) {
    setPrevAuditId(auditId);
    setIsLoading(isValidAuditId);
    setLoadError(isValidAuditId ? null : '잘못된 감사 ID입니다.');
    setShapMetrics([]);
    setFairnessResults([]);
    setTopFeatures([]);
    setAuditSummary(null);
    setRecentHistory([]);
  }

  useEffect(() => {
    const idForFetch = Number(auditId);
    if (!auditId || Number.isNaN(idForFetch)) return;

    let cancelled = false;

    Promise.all([getExplainability(idForFetch), getFairness(idForFetch), getAudits()])
      .then(([explainability, fairness, audits]) => {
        if (cancelled) return;
        // SENSITIVE_CONTRIB는 이 페이지의 "예측 영향 변수 TOP5" 쪽에서 별도로 다루므로 카드에서는 제외
        setShapMetrics(
          explainability.metrics.filter((metric) => metric.metricCode !== 'SENSITIVE_CONTRIB'),
        );
        setTopFeatures(explainability.topFeatures ?? []);
        setFairnessResults(fairness.results);
        // TODO: 단건 상세 조회 API가 생기면 이 목록 필터링 대신 그걸로 교체
        setAuditSummary(audits.find((audit) => audit.auditId === idForFetch) ?? null);
        setRecentHistory(selectRecentHistory(audits));
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError('감사 결과를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [auditId]);

  const segments = buildStatusSegments(shapMetrics, fairnessResults);

  return (
    <MainLayout>
      <div className="dashboard-detail-page">
        <header className="dashboard-detail-page__header">
          <div className="dashboard-detail-page__title-area">
            <h1 className="dashboard-detail-page__title">
              {auditSummary?.modelName ?? '모델'}
              <span className="dashboard-detail-page__title-suffix"> 감사 세부정보</span>
            </h1>

            <div className="dashboard-detail-page__meta">
              <div>
                <p className="dashboard-detail-page__meta-label">모델 파일명</p>
                <p className="dashboard-detail-page__meta-value">
                  {auditSummary?.modelFileName ?? '—'}
                </p>
              </div>
              <div>
                <p className="dashboard-detail-page__meta-label">데이터</p>
                <p className="dashboard-detail-page__meta-value">
                  {auditSummary?.datasetFileName ?? '—'}
                </p>
              </div>
              <div>
                <p className="dashboard-detail-page__meta-label">감사일자</p>
                <p className="dashboard-detail-page__meta-value">
                  {formatAuditDate(auditSummary?.completedAt ?? null)}
                </p>
              </div>
            </div>
          </div>

          <div className="dashboard-detail-page__risk-area">
            <div className="dashboard-detail-page__risk-gauge-wrap">
              <p className="dashboard-detail-page__risk-label">지표 판정 분포</p>
              <StatusDonut segments={segments} />
            </div>

            <StatusLegend segments={segments} />

            <div className="dashboard-detail-page__risk-status">
              <p className="dashboard-detail-page__risk-label">상태</p>
              {auditSummary ? (
                <span
                  className="dashboard-detail-page__status-badge"
                  style={{
                    backgroundColor: STATUS_BG_COLOR[auditSummary.status],
                    color: STATUS_TEXT_COLOR[auditSummary.status],
                  }}
                >
                  {STATUS_LABEL[auditSummary.status]}
                </span>
              ) : (
                <span className="dashboard-detail-page__status-badge">—</span>
              )}
            </div>
          </div>
        </header>

        <div className="dashboard-detail-page__grid">
          <ExplainabilityCard metrics={shapMetrics} isLoading={isLoading} error={loadError} />
          <TopFeaturesCard features={topFeatures} isLoading={isLoading} error={loadError} />
        </div>

        <FairnessTable results={fairnessResults} isLoading={isLoading} error={loadError} />
        <ReportsSection auditId={Number(auditId)} />
        <AuditHistorySection
          audits={recentHistory}
          currentAuditId={numericAuditId}
          isLoading={isLoading}
        />

        <div className="dashboard-detail-page__footer">
          <Link to="/dashboard" className="dashboard-detail-page__list-button">
            대시보드 목록
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}

export default DashboardDetailPage;
