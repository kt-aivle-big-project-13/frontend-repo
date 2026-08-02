import type { AuditStatus } from '../../../../features/audit/api/auditApi';

export const STATUS_LABEL: Record<AuditStatus, string> = {
  COMPLIANT: '준수 (Compliant)',
  WARNING: '주의 (Warning)',
  NON_COMPLIANT: '미충족 (Non-Compliant)',
  PENDING: '대기 중',
  IN_PROGRESS: '분석 중',
  UNCONFIRMED: '미확인',
  FAILED: '분석 실패',
};

export const STATUS_TEXT_COLOR: Record<AuditStatus, string> = {
  COMPLIANT: '#1b9851',
  WARNING: '#e09c14',
  NON_COMPLIANT: '#d93e44',
  PENDING: '#6b7684',
  IN_PROGRESS: '#2d67e8',
  UNCONFIRMED: '#6b7684',
  FAILED: '#d93e44',
};

export const STATUS_BG_COLOR: Record<AuditStatus, string> = {
  COMPLIANT: '#e7f6ec',
  WARNING: '#fef2d8',
  NON_COMPLIANT: '#feecea',
  PENDING: '#f7f8fa',
  IN_PROGRESS: '#eef4ff',
  UNCONFIRMED: '#f7f8fa',
  FAILED: '#feecea',
};

export function formatAuditDate(completedAt: string | null): string {
  if (!completedAt) return '—';

  const date = new Date(completedAt);
  if (Number.isNaN(date.getTime())) return '—';

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}