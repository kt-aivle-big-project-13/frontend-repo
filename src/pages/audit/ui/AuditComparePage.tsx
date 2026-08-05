import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';

import {
  getAudits,
  getExplainability,
  getFairness,
  TERMINAL_STATUSES,
  type AuditSummary,
} from '../../../features/audit/api/auditApi';
import MainLayout from '../../../widgets/layout/ui/MainLayout';

import AuditCompareSection from './sections/AuditCompareSection';
import './AuditComparePage.css';

// 같은 모델 계열의 완료된 감사만 비교 대상으로 삼는다. AuditResultsSection의
// selectVersionHistory와 같은 기준 — 분석이 실패한 감사는 비교할 지표 자체가 없다.
function isComparable(audit: AuditSummary): boolean {
  return TERMINAL_STATUSES.includes(audit.status) && audit.status !== 'FAILED';
}

function completedAtMillis(audit: AuditSummary): number {
  return audit.completedAt ? new Date(audit.completedAt).getTime() : 0;
}

function AuditComparePage() {
  const { auditId: auditIdParam } = useParams<{ auditId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const baseAuditId = Number(auditIdParam);
  const parsedOtherId = Number(searchParams.get('with'));
  const explicitOtherId =
    Number.isSafeInteger(parsedOtherId) && parsedOtherId > 0 ? parsedOtherId : null;

  const auditsQuery = useQuery({ queryKey: ['audits'], queryFn: getAudits });

  const baseSummary = auditsQuery.data?.find((audit) => audit.auditId === baseAuditId) ?? null;

  // URL에 "with"가 없으면 같은 모델 계열에서 이 감사 바로 다음으로 최근에 완료된 버전을
  // 자동으로 찾는다 — 링크만 눌러도 "최신 vs 직전 버전" 비교가 기본으로 열리게 하기 위함이다.
  const otherAuditId = useMemo(() => {
    if (explicitOtherId != null) return explicitOtherId;
    if (!auditsQuery.data || !baseSummary?.modelGroupId) return null;

    const sameGroup = auditsQuery.data
      .filter(
        (audit) =>
          audit.modelGroupId === baseSummary.modelGroupId &&
          audit.auditId !== baseAuditId &&
          isComparable(audit),
      )
      .sort((a, b) => completedAtMillis(b) - completedAtMillis(a));

    return sameGroup[0]?.auditId ?? null;
  }, [auditsQuery.data, baseAuditId, baseSummary, explicitOtherId]);

  const otherSummary = auditsQuery.data?.find((audit) => audit.auditId === otherAuditId) ?? null;

  // otherAuditId가 자동으로 고른 값이면 이미 같은 모델 계열·비교 가능 상태만 걸러진 값이지만,
  // "with"가 URL에서 직접 온 값이면 검증된 적이 없다 — 존재하지 않는 auditId, 다른 모델
  // 계열, 자기 자신, 아직 분석이 안 끝난 감사를 그대로 비교 대상으로 삼지 않도록 여기서
  // 한 번 더 확인한다.
  const isOtherValid =
    baseSummary != null &&
    otherSummary != null &&
    otherSummary.auditId !== baseSummary.auditId &&
    otherSummary.modelGroupId === baseSummary.modelGroupId &&
    isComparable(otherSummary);

  // 먼저 완료된 쪽을 "이전", 나중에 완료된 쪽을 "최신"으로 고정한다 — URL 파라미터 순서와
  // 무관하게 항상 "이전 → 최신" 방향으로 읽히게 하기 위함이다.
  const [previousSummary, latestSummary] = useMemo(() => {
    if (!baseSummary || !otherSummary || !isOtherValid) return [null, null] as const;

    return completedAtMillis(baseSummary) <= completedAtMillis(otherSummary)
      ? ([baseSummary, otherSummary] as const)
      : ([otherSummary, baseSummary] as const);
  }, [baseSummary, otherSummary, isOtherValid]);

  const [previousExplainability, latestExplainability, previousFairness, latestFairness] =
    useQueries({
      // 두 요약이 아직 안 정해졌을 때(auditId가 둘 다 undefined) previous/latest 쿼리키가
      // 우연히 같아지지 않도록, id 대신 역할(previous/latest)을 키에 고정으로 넣는다.
      queries: [
        {
          queryKey: ['audit-compare', 'previous', 'explainability', previousSummary?.auditId],
          queryFn: () => getExplainability(previousSummary!.auditId),
          enabled: previousSummary != null,
          retry: false,
        },
        {
          queryKey: ['audit-compare', 'latest', 'explainability', latestSummary?.auditId],
          queryFn: () => getExplainability(latestSummary!.auditId),
          enabled: latestSummary != null,
          retry: false,
        },
        {
          queryKey: ['audit-compare', 'previous', 'fairness', previousSummary?.auditId],
          queryFn: () => getFairness(previousSummary!.auditId),
          enabled: previousSummary != null,
          retry: false,
        },
        {
          queryKey: ['audit-compare', 'latest', 'fairness', latestSummary?.auditId],
          queryFn: () => getFairness(latestSummary!.auditId),
          enabled: latestSummary != null,
          retry: false,
        },
      ],
    });

  const isResolvingPair = auditsQuery.isPending;
  const hasPair = previousSummary != null && latestSummary != null;
  const isLoadingMetrics =
    hasPair &&
    [previousExplainability, latestExplainability, previousFairness, latestFairness].some(
      (query) => query.isPending,
    );

  return (
    <MainLayout>
      <div className="audit-compare-page">
        <div className="audit-compare-page__inner">
          <header className="audit-compare-page__header">
            <button
              type="button"
              className="audit-compare-page__back"
              onClick={() => navigate(`/audit/${baseAuditId}/results`)}
            >
              ← 결과로 돌아가기
            </button>
            <h1 className="audit-compare-page__title">버전 비교</h1>
            <p className="audit-compare-page__description">
              같은 모델 계열의 최신 버전과 직전 버전의 지표 변화를 비교합니다.
            </p>
          </header>

          {auditsQuery.isError && (
            <p className="audit-compare-page__empty" role="alert">
              감사 목록을 불러오지 못했습니다.
            </p>
          )}

          {/* 감사 목록 자체가 아직 로딩 중이면(baseSummary가 있든 없든) 우선 로딩부터 보여준다. */}
          {!auditsQuery.isError && isResolvingPair && (
            <p className="audit-compare-page__status" role="status">
              비교 데이터를 불러오는 중입니다…
            </p>
          )}

          {!auditsQuery.isError && !isResolvingPair && !baseSummary && (
            <p className="audit-compare-page__empty" role="alert">
              비교할 감사를 찾을 수 없습니다.
            </p>
          )}

          {!isResolvingPair && baseSummary && (!otherAuditId || !isOtherValid) && (
            <p className="audit-compare-page__empty">
              {explicitOtherId != null
                ? '지정한 감사와는 비교할 수 없습니다. 같은 모델 계열의 완료된 다른 버전만 비교할 수 있습니다.'
                : '비교할 이전 버전이 없습니다. 같은 모델로 완료된 다른 감사가 있어야 비교할 수 있습니다.'}
            </p>
          )}

          {!isResolvingPair && isOtherValid && isLoadingMetrics && (
            <p className="audit-compare-page__status" role="status">
              비교 데이터를 불러오는 중입니다…
            </p>
          )}

          {!isResolvingPair && !isLoadingMetrics && isOtherValid && previousSummary && latestSummary && (
            <AuditCompareSection
              previousSummary={previousSummary}
              latestSummary={latestSummary}
              previousExplainability={previousExplainability.data ?? null}
              latestExplainability={latestExplainability.data ?? null}
              previousFairness={previousFairness.data ?? null}
              latestFairness={latestFairness.data ?? null}
              previousDataError={previousExplainability.isError || previousFairness.isError}
              latestDataError={latestExplainability.isError || latestFairness.isError}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default AuditComparePage;
