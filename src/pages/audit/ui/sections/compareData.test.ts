import { describe, expect, it } from 'vitest';

import { buildStatusDistribution, compareByLabel, formatDelta } from './compareData';

describe('compareByLabel', () => {
  it('둘 다 없으면 비교 불가다', () => {
    expect(compareByLabel(null, undefined)).toBe('unavailable');
  });

  it('이전만 없으면 신규 계산이다', () => {
    expect(compareByLabel(null, '충족')).toBe('new');
  });

  it('최신만 없으면 계산불가 전환이다', () => {
    expect(compareByLabel('충족', null)).toBe('removed');
  });

  it('등급이 오르면 개선이다', () => {
    expect(compareByLabel('추가검토', '주의')).toBe('improved');
    expect(compareByLabel('주의', '충족')).toBe('improved');
  });

  it('등급이 내리면 악화다', () => {
    expect(compareByLabel('충족', '주의')).toBe('worsened');
    expect(compareByLabel('주의', '추가검토')).toBe('worsened');
  });

  it('같은 등급이면 동일이다', () => {
    expect(compareByLabel('충족', '충족')).toBe('same');
  });

  it('값이 커야 좋은지 작아야 좋은지와 무관하게 라벨 등급만 본다', () => {
    // 값 자체의 증감 방향은 여기서 안 쓴다 — 라벨만으로 판단해야 한다는 게 이 함수의 계약이다.
    expect(compareByLabel('추가검토', '추가검토')).toBe('same');
  });
});

describe('buildStatusDistribution', () => {
  it('SHAP과 Fairlearn 카운트를 통일 라벨 기준으로 합산한다', () => {
    const distribution = buildStatusDistribution(
      { pass: 2, warning: 1, review: 1 },
      { pass: 3, review: 2, fail: 1, na: 4 },
    );

    // SHAP.warning + Fairlearn.review → "주의", SHAP.review + Fairlearn.fail → "추가검토"
    expect(distribution).toEqual({ pass: 5, warning: 3, review: 2, na: 4 });
  });

  it('둘 다 0이면 전부 0이다', () => {
    const distribution = buildStatusDistribution(
      { pass: 0, warning: 0, review: 0 },
      { pass: 0, review: 0, fail: 0, na: 0 },
    );

    expect(distribution).toEqual({ pass: 0, warning: 0, review: 0, na: 0 });
  });
});

describe('formatDelta', () => {
  it('증가는 + 부호를 붙인다', () => {
    expect(formatDelta(1, 3)).toBe('+2');
  });

  it('감소는 - 부호가 그대로 붙는다', () => {
    expect(formatDelta(3, 1)).toBe('-2');
  });

  it('변화가 없으면 ±0이다', () => {
    expect(formatDelta(5, 5)).toBe('±0');
  });
});
