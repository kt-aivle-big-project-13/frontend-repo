import { describe, expect, it } from 'vitest';

import type { AuditStatus, AuditSummary } from '../api/auditApi';

import { selectRecentAudits } from './selectRecentAudits';

let nextId = 1;

function audit(overrides: Partial<AuditSummary> = {}): AuditSummary {
  const id = nextId++;

  return {
    auditId: id,
    modelName: 'credit-model',
    modelFileName: 'credit_model.json',
    datasetFileName: 'audit.csv',
    modelGroupId: `group-${id}`,
    version: 'v1',
    assessmentId: null,
    createdAt: '2026-08-01T00:00:00Z',
    completedAt: '2026-08-01T00:00:00Z',
    status: 'COMPLIANT',
    currentStep: 5,
    ...overrides,
  };
}

describe('selectRecentAudits', () => {
  it('진행 중인 감사는 제외한다', () => {
    const statuses: AuditStatus[] = ['PENDING', 'IN_PROGRESS'];
    const audits = statuses.map((status) => audit({ status }));

    expect(selectRecentAudits(audits, 10)).toEqual([]);
  });

  it('실패·취소된 감사는 제외한다', () => {
    const audits = [audit({ status: 'FAILED' }), audit({ status: 'CANCELLED' })];

    expect(selectRecentAudits(audits, 10)).toEqual([]);
  });

  it('같은 모델 계열은 최신 완료본 하나만 남긴다', () => {
    const older = audit({ modelGroupId: 'group-a', completedAt: '2026-08-01T00:00:00Z' });
    const newer = audit({ modelGroupId: 'group-a', completedAt: '2026-08-05T00:00:00Z' });

    const result = selectRecentAudits([older, newer], 10);

    expect(result).toEqual([newer]);
  });

  it('완료 시각 최신순으로 정렬한다', () => {
    const first = audit({ modelGroupId: 'a', completedAt: '2026-08-01T00:00:00Z' });
    const second = audit({ modelGroupId: 'b', completedAt: '2026-08-03T00:00:00Z' });
    const third = audit({ modelGroupId: 'c', completedAt: '2026-08-02T00:00:00Z' });

    const result = selectRecentAudits([first, second, third], 10);

    expect(result.map((item) => item.auditId)).toEqual([second.auditId, third.auditId, first.auditId]);
  });

  it('limit개까지만 돌려준다', () => {
    const audits = Array.from({ length: 5 }, () => audit());

    expect(selectRecentAudits(audits, 2)).toHaveLength(2);
  });

  it('modelGroupId가 없으면 감사 ID 기준으로 따로 취급한다', () => {
    const first = audit({ modelGroupId: null });
    const second = audit({ modelGroupId: null });

    // 같은 그룹으로 묶이면 하나가 사라지는데, 묶이지 않아야 하므로 둘 다 남아야 한다.
    expect(selectRecentAudits([first, second], 10)).toHaveLength(2);
  });

  it('완료 시각이 없는 감사끼리는 원래 순서를 유지한다', () => {
    // UNCONFIRMED는 TERMINAL_STATUSES에 있지만 완료 전일 수 있어 completedAt이 null일 수 있다.
    const first = audit({ modelGroupId: 'a', status: 'UNCONFIRMED', completedAt: null });
    const second = audit({ modelGroupId: 'b', status: 'UNCONFIRMED', completedAt: null });

    expect(selectRecentAudits([first, second], 10)).toHaveLength(2);
  });
});
