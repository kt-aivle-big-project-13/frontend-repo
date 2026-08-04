import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'antd';

import {
  getAudits,
  getExplainability,
  getFairness,
  getSelfCheckAnswers,
  TERMINAL_STATUSES,
  type AuditSummary,
  type FairlearnResultItem,
  type FeatureImportanceItem,
  type ShapMetricItem,
} from '../../../../features/audit/api/auditApi';
import { markAuditResultsViewed } from '../../../../features/audit/model/viewedAuditResults';
import StepIndicator from '../StepIndicator';

import { formatAuditDate, STATUS_BG_COLOR, STATUS_LABEL, STATUS_TEXT_COLOR } from './auditStatusMeta';
import ExplainabilityCard from './ExplainabilityCard';
import { getFairnessStatusCounts } from './fairnessData';
import FairnessTable from './FairnessTable';
import ReportsSection from './ReportsSection';
import { getShapStatusCounts } from './shapData';
import TopFeaturesCard from './TopFeaturesCard';
import VersionHistorySection from './VersionHistorySection';

import './AuditFlow.css';
import './AuditResultsDetail.css';

// 같은 모델 계열(modelGroupId)의 완료된 감사들만 모아 버전끼리 비교할 수 있게 한다.
function selectVersionHistory(audits: AuditSummary[], modelGroupId: string | null): AuditSummary[] {
  if (!modelGroupId) return [];

  return audits
    .filter(
      (audit) =>
        audit.modelGroupId === modelGroupId &&
        TERMINAL_STATUSES.includes(audit.status) &&
        audit.status !== 'FAILED',
    )
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bTime - aTime;
    });
}

interface StatusSegment {
  label: string;
  count: number;
  color: string;
}

const GAUGE_RADIUS = 40;
const GAUGE_STROKE_WIDTH = 12;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

// SHAP(민감변수 기여비율 제외 2개) + Fairlearn 14개(민감변수2×지표7) 판정을 집계.
// 임의로 지어낸 "종합 위험 점수"가 아니라, 실제 지표 판정 개수를 그대로 세어 비율로 보여준다.
// SHAP·Fairlearn 모두 "충족 > 주의 > 추가검토" 3단계로 라벨이 통일돼 있으므로(shapData.ts,
// fairnessData.ts 참고) 여기서도 그 3단계 + 계산불가로만 나눈다. Fairlearn의 원래 상태
// 코드(REVIEW/FAIL)와 화면 라벨(주의/추가검토)이 더는 이름이 같지 않으니 주의해서 매핑한다:
// Fairlearn REVIEW(중간 등급) → "주의" 합계, Fairlearn FAIL(최하 등급)과 SHAP REVIEW(최하
// 등급) → "추가검토" 합계.
function buildStatusSegments(
  shapMetrics: ShapMetricItem[],
  fairnessResults: FairlearnResultItem[],
): StatusSegment[] {
  const shap = getShapStatusCounts(shapMetrics);
  const fairness = getFairnessStatusCounts(fairnessResults);

  return [
    { label: '충족', count: shap.pass + fairness.pass, color: '#1b9851' },
    { label: '주의', count: shap.warning + fairness.review, color: '#e09c14' },
    { label: '추가검토', count: shap.review + fairness.fail, color: '#d93e44' },
    { label: '계산불가', count: fairness.na, color: '#c1c7d0' },
  ];
}

function StatusDonut({ segments }: { segments: StatusSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  const passRatio = total === 0 ? 0 : Math.round(((segments[0]?.count ?? 0) / total) * 100);

  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" className="audit-results-detail__gauge">
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
      <text x="50" y="54" textAnchor="middle" className="audit-results-detail__gauge-value">
        {passRatio}%
      </text>
      <text x="50" y="68" textAnchor="middle" className="audit-results-detail__gauge-caption">
        충족
      </text>
    </svg>
  );
}

// "계산불가"는 판정 상태 코드가 아니라, 민감그룹 하위집단 표본이 부족해 공정성 지표
// 자체를 계산하지 못해 결과가 아예 없는 경우를 뜻한다(백엔드 FairnessResultService가
// 그런 지표만 조용히 건너뛴다). 다른 세 상태(충족/주의/추가검토)와 의미가 달라 오해하지
// 않도록 툴팁으로 설명을 덧붙인다.
const NA_LEGEND_TOOLTIP =
  '민감그룹 내 표본이 부족해 공정성 지표를 계산할 수 없었던 항목의 개수입니다.';

function StatusLegend({ segments }: { segments: StatusSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);

  return (
    <ul className="audit-results-detail__legend">
      {segments.map((segment) => (
        <li key={segment.label} className="audit-results-detail__legend-row">
          <span
            className="audit-results-detail__legend-dot"
            style={{ backgroundColor: segment.color }}
          />
          {segment.label === '계산불가' ? (
            <Tooltip title={NA_LEGEND_TOOLTIP}>
              <span className="audit-results-detail__legend-label">{segment.label}</span>
            </Tooltip>
          ) : (
            <span className="audit-results-detail__legend-label">{segment.label}</span>
          )}
          <span className="audit-results-detail__legend-value">
            {segment.count}개 ({total === 0 ? 0 : Math.round((segment.count / total) * 100)}%)
          </span>
        </li>
      ))}
    </ul>
  );
}

interface AuditResultsSectionProps {
  auditId: number;
}

function AuditResultsSection({ auditId }: AuditResultsSectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shapMetrics, setShapMetrics] = useState<ShapMetricItem[]>([]);
  const [fairnessResults, setFairnessResults] = useState<FairlearnResultItem[]>([]);
  const [topFeatures, setTopFeatures] = useState<FeatureImportanceItem[]>([]);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [versionHistory, setVersionHistory] = useState<AuditSummary[]>([]);
  const [hasSelfCheck, setHasSelfCheck] = useState(false);

  const navigate = useNavigate();

  // auditId가 바뀌면(다른 감사의 결과 페이지로 바로 이동) 이전 감사의 결과가 잠시
  // 남아있지 않도록 렌더링 중에 바로 리셋한다.
  const [prevAuditId, setPrevAuditId] = useState(auditId);
  if (auditId !== prevAuditId) {
    setPrevAuditId(auditId);
    setIsLoading(true);
    setLoadError(null);
    setShapMetrics([]);
    setFairnessResults([]);
    setTopFeatures([]);
    setAuditSummary(null);
    setVersionHistory([]);
    setHasSelfCheck(false);
  }

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getExplainability(auditId),
      getFairness(auditId),
      getAudits(),
      getSelfCheckAnswers(auditId),
    ])
      .then(([explainability, fairness, audits, selfCheck]) => {
        if (cancelled) return;
        // SENSITIVE_CONTRIB는 "예측 영향 변수 TOP5" 쪽에서 별도로 다루므로 카드에서는 제외
        setShapMetrics(
          explainability.metrics.filter((metric) => metric.metricCode !== 'SENSITIVE_CONTRIB'),
        );
        setTopFeatures(explainability.topFeatures ?? []);
        setFairnessResults(fairness.results);
        const currentAudit = audits.find((audit) => audit.auditId === auditId) ?? null;
        setAuditSummary(currentAudit);
        setVersionHistory(selectVersionHistory(audits, currentAudit?.modelGroupId ?? null));
        // 자가점검을 건너뛰었거나 아직 제출하지 않은 감사는 응답이 빈 배열이라 규제준수
        // 판정서를 만들 수 없다(ReportsSection에서 카드 자체를 숨기는 데 사용).
        setHasSelfCheck(selfCheck.answers.length > 0);

        // 이 페이지가 감사의 최종 결과 화면이므로, 결과 조회에 성공한 시점에만 "결과 확인함"으로
        // 표시해 홈 화면의 "진행중 감사" 목록에서 빠지도록 한다. 조회가 실패하면(네트워크 오류 등)
        // 사용자가 결과를 실제로 보지 못한 것이므로 viewed 처리하지 않고 목록에 남겨둔다.
        markAuditResultsViewed(auditId);
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

  const segments = buildStatusSegments(shapMetrics, fairnessResults);

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
        <div className="audit-results-detail">
          <header className="audit-results-detail__header">
            <div className="audit-results-detail__title-area">
              <h2 className="audit-results-detail__model-title">
                {auditSummary?.modelName ?? '모델'}
                {auditSummary?.version && (
                  <span className="audit-results-detail__model-version"> {auditSummary.version}</span>
                )}
              </h2>

              <div className="audit-results-detail__meta">
                <div>
                  <p className="audit-results-detail__meta-label">모델 파일명</p>
                  <p className="audit-results-detail__meta-value">
                    {auditSummary?.modelFileName ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="audit-results-detail__meta-label">데이터</p>
                  <p className="audit-results-detail__meta-value">
                    {auditSummary?.datasetFileName ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="audit-results-detail__meta-label">감사일자</p>
                  <p className="audit-results-detail__meta-value">
                    {formatAuditDate(auditSummary?.completedAt ?? null)}
                  </p>
                </div>
              </div>
            </div>

            <div className="audit-results-detail__risk-area">
              <div className="audit-results-detail__risk-gauge-wrap">
                <p className="audit-results-detail__risk-label">지표 판정 분포</p>
                <StatusDonut segments={segments} />
              </div>

              <StatusLegend segments={segments} />

              <div className="audit-results-detail__risk-status">
                <p className="audit-results-detail__risk-label">상태</p>
                {auditSummary ? (
                  <span
                    className="audit-results-detail__status-badge"
                    style={{
                      backgroundColor: STATUS_BG_COLOR[auditSummary.status],
                      color: STATUS_TEXT_COLOR[auditSummary.status],
                    }}
                  >
                    {STATUS_LABEL[auditSummary.status]}
                  </span>
                ) : (
                  <span className="audit-results-detail__status-badge">—</span>
                )}
              </div>
            </div>
          </header>

          <div className="audit-results-detail__grid">
            <ExplainabilityCard metrics={shapMetrics} isLoading={false} error={null} />
            <TopFeaturesCard features={topFeatures} isLoading={false} error={null} />
          </div>

          <FairnessTable results={fairnessResults} isLoading={false} error={null} />
          {/* 사전진단을 건너뛴 감사(assessmentId 없음)에는 사전진단 보고서를, 자가점검을
              제출하지 않은 감사에는 규제준수 판정서를 만들 수 없다. 요약을 아직 못 받아온
              경우엔 판단할 수 없으므로 기존대로 노출한다. */}
          <ReportsSection
            auditId={auditId}
            hasPreDiagnosis={auditSummary ? auditSummary.assessmentId !== null : true}
            hasSelfCheck={hasSelfCheck}
          />
          <VersionHistorySection audits={versionHistory} currentAuditId={auditId} isLoading={false} />
          <div className="audit-results-detail__dashboard-area">
            <button
              type="button"
              className="audit-results-detail__dashboard-button"
              onClick={() => navigate('/dashboard')}
            >
              대시보드
              <span aria-hidden="true">➔</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditResultsSection;