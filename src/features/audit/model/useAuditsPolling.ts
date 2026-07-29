import { useCallback, useEffect, useState } from 'react';

import { getAudits, type AuditSummary } from '../api/auditApi';

const AUDIT_POLL_INTERVAL_MS = 5000;

// 로그인 사용자의 감사 목록을 주기적으로 조회한다. 감사는 짧으면 몇 초 안에 끝나서
// 한 번만 조회하면 진행중 상태를 거의 못 보고 완료 상태로 넘어가버리기 때문에,
// enabled인 동안은 주기적으로 다시 조회해 상태 전환이 반영되도록 한다.
export function useAuditsPolling(enabled: boolean): AuditSummary[] | null {
  const [audits, setAudits] = useState<AuditSummary[] | null>(null);

  const refresh = useCallback(() => {
    // 일시적인 네트워크 오류로 목록을 빈 배열로 초기화하면 화면이 순간적으로
    // 비어 보이므로, 실패 시에는 이전 값을 유지하고 다음 폴링에서 재시도한다.
    getAudits()
      .then(setAudits)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!enabled) return;

    refresh();

    const timer = window.setInterval(refresh, AUDIT_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [enabled, refresh]);

  return audits;
}

export function hasInProgressAudit(audits: AuditSummary[] | null): boolean {
  return (audits ?? []).some(
    (audit) => audit.status === 'PENDING' || audit.status === 'IN_PROGRESS',
  );
}