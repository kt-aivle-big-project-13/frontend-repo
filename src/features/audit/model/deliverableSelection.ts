// STEP4 결과 페이지의 "산출물 선택"에서 고른 항목을 감사별로 기록해둔다. 백엔드에
// 선택 상태를 저장하는 필드가 없어 브라우저에만 저장하며(viewedAuditResults.ts와 동일한
// 트레이드오프), 대시보드 상세보기의 보고서 카드가 이 선택을 그대로 반영해서 보여준다.
function storageKey(auditId: number): string {
  return `audit-selected-deliverables-${auditId}`;
}

// 저장된 적이 없으면(=아직 STEP4를 거치지 않았거나 기록이 없으면) null을 돌려주고,
// 호출하는 쪽에서 "전체 선택"으로 취급한다.
export function getSelectedDeliverables(auditId: number): Set<string> | null {
  try {
    const raw = window.localStorage.getItem(storageKey(auditId));
    if (raw === null) return null;

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((id) => typeof id === 'string'))
      : null;
  } catch {
    return null;
  }
}

export function setSelectedDeliverables(auditId: number, ids: Set<string>): void {
  try {
    window.localStorage.setItem(storageKey(auditId), JSON.stringify([...ids]));
  } catch {
    // 프라이빗 모드 등으로 localStorage를 못 쓰는 경우, 이 기능만 조용히 무시한다.
  }
}
