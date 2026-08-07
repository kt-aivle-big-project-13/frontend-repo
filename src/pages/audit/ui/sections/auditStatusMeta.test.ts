import { describe, expect, it } from 'vitest';

import { formatAuditDate } from './auditStatusMeta';

describe('formatAuditDate', () => {
  it('ISO 날짜를 한글 형식으로 바꾼다', () => {
    expect(formatAuditDate('2026-08-06T10:30:00Z')).toBe('2026년 8월 6일');
  });

  it('null이면 —를 돌려준다', () => {
    expect(formatAuditDate(null)).toBe('—');
  });

  it('파싱할 수 없는 문자열이면 —를 돌려준다', () => {
    expect(formatAuditDate('not-a-date')).toBe('—');
  });

  it('빈 문자열이면 —를 돌려준다', () => {
    expect(formatAuditDate('')).toBe('—');
  });
});
