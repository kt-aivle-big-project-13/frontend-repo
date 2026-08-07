import { describe, expect, it } from 'vitest';

import type { ShapMetricItem } from '../../../../features/audit/api/auditApi';

import { getShapStatusCounts } from './shapData';

function metric(overrides: Partial<ShapMetricItem> = {}): ShapMetricItem {
  return {
    metricCode: 'GLOBAL_STABILITY',
    value: 0.8,
    threshold: 0.7,
    status: 'PASS',
    ...overrides,
  };
}

describe('getShapStatusCounts', () => {
  it('PASS/WARNING/REVIEW를 각각 센다', () => {
    const counts = getShapStatusCounts([
      metric({ status: 'PASS' }),
      metric({ status: 'WARNING' }),
      metric({ status: 'REVIEW' }),
    ]);

    expect(counts).toEqual({ pass: 1, warning: 1, review: 1 });
  });

  it('WARNING과 REVIEW를 하나로 합치지 않는다', () => {
    // 카드에 찍히는 라벨이 "주의"/"추가검토"로 다르므로 집계도 따로 세야 한다.
    const counts = getShapStatusCounts([
      metric({ status: 'WARNING' }),
      metric({ status: 'WARNING' }),
      metric({ status: 'REVIEW' }),
    ]);

    expect(counts.warning).toBe(2);
    expect(counts.review).toBe(1);
  });

  it('결과가 없으면 전부 0이다', () => {
    expect(getShapStatusCounts([])).toEqual({ pass: 0, warning: 0, review: 0 });
  });
});
