import { TERMINAL_STATUSES, type AuditSummary } from '../api/auditApi';

// 실패(FAILED)·아직 안 끝난 감사는 제외하고, 같은 모델 계열(modelGroupId)은 최신 버전
// 하나만 남겨(여러 버전이 목록을 채우지 않도록 — 버전끼리 비교는 별도 화면에서 함)
// 최근 완료된 순서로 최대 limit개를 돌려준다.
export function selectRecentAudits(audits: AuditSummary[], limit: number): AuditSummary[] {
  const completedAtTime = (audit: AuditSummary) =>
    audit.completedAt ? new Date(audit.completedAt).getTime() : 0;

  const latestPerModelGroup = new Map<string, AuditSummary>();
  for (const audit of audits) {
    if (!TERMINAL_STATUSES.includes(audit.status) || audit.status === 'FAILED') continue;

    const key = audit.modelGroupId ?? `audit-${audit.auditId}`;
    const existing = latestPerModelGroup.get(key);
    if (!existing || completedAtTime(audit) > completedAtTime(existing)) {
      latestPerModelGroup.set(key, audit);
    }
  }

  return [...latestPerModelGroup.values()]
    .sort((a, b) => completedAtTime(b) - completedAtTime(a))
    .slice(0, limit);
}
