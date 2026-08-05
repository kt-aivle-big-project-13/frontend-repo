// SHAP·Fairlearn 지표 각각 원래 상태 코드 체계가 달라(REVIEW가 SHAP에선 "추가검토",
// Fairlearn에선 "주의") 코드 값으로 직접 순위를 매기면 어긋난다. 그래서 항상 화면에 실제로
// 보여주는 통일 라벨(충족/주의/추가검토, shapData.ts·fairnessData.ts의 *_STATUS_LABEL로
// 변환한 값)을 기준으로 비교한다.
const LABEL_RANK: Record<string, number> = {
  충족: 2,
  주의: 1,
  추가검토: 0,
};

export type ComparisonTrend = 'improved' | 'worsened' | 'same' | 'new' | 'removed' | 'unavailable';

export const TREND_LABEL: Record<ComparisonTrend, string> = {
  improved: '개선',
  worsened: '악화',
  same: '동일',
  new: '신규 계산',
  removed: '계산불가 전환',
  unavailable: '비교 불가',
};

// 화살표는 방향(위/아래)만 나타내고, 실제 "좋아짐/나빠짐" 판단은 라벨 등급 비교로 한다 —
// 지표마다 값이 커야 좋은지 작아야 좋은지 달라서 값 자체의 증감 방향으로는 판단할 수 없다.
export const TREND_ICON: Record<ComparisonTrend, string> = {
  improved: '▲',
  worsened: '▼',
  same: '－',
  new: '＋',
  removed: '－',
  unavailable: '·',
};

export const TREND_COLOR: Record<ComparisonTrend, string> = {
  improved: '#1b9851',
  worsened: '#d93e44',
  same: '#6b7684',
  new: '#2d67e8',
  removed: '#e09c14',
  unavailable: '#c1c7d0',
};

// 이전 라벨 → 최신 라벨 변화를 비교한다. 한쪽만 없으면(계산불가 ↔ 계산됨 전환) new/removed로,
// 둘 다 없으면 unavailable로 구분한다.
export function compareByLabel(
  previousLabel: string | null | undefined,
  latestLabel: string | null | undefined,
): ComparisonTrend {
  if (!previousLabel && !latestLabel) return 'unavailable';
  if (!previousLabel) return 'new';
  if (!latestLabel) return 'removed';

  const previousRank = LABEL_RANK[previousLabel] ?? 1;
  const latestRank = LABEL_RANK[latestLabel] ?? 1;

  if (latestRank > previousRank) return 'improved';
  if (latestRank < previousRank) return 'worsened';
  return 'same';
}

export interface StatusDistribution {
  pass: number;
  warning: number;
  review: number;
  na: number;
}

export function buildStatusDistribution(
  shapCounts: { pass: number; warning: number; review: number },
  fairnessCounts: { pass: number; review: number; fail: number; na: number },
): StatusDistribution {
  return {
    pass: shapCounts.pass + fairnessCounts.pass,
    warning: shapCounts.warning + fairnessCounts.review,
    review: shapCounts.review + fairnessCounts.fail,
    na: fairnessCounts.na,
  };
}

export function formatDelta(previous: number, latest: number): string {
  const delta = latest - previous;
  if (delta === 0) return '±0';
  return delta > 0 ? `+${delta}` : `${delta}`;
}

// FairnessTable.css의 배지 색(pass/review/fail/na)과 동일한 팔레트를 통일 라벨 기준으로 다시
// 매핑한다 — SHAP·Fairlearn 표·막대·도넛 전부 이 색으로 통일해서, 표만 읽지 않고도 색만 보고
// 판정을 훑을 수 있게 한다.
export const STATUS_COLOR: Record<string, { text: string; bg: string }> = {
  충족: { text: '#1b9851', bg: '#e7f6ec' },
  주의: { text: '#e09c14', bg: '#fef2d8' },
  추가검토: { text: '#d93e44', bg: '#feecea' },
  계산불가: { text: '#9099a8', bg: '#f7f8fa' },
};

export const DEFAULT_STATUS_COLOR = { text: '#c1c7d0', bg: '#f7f8fa' };
