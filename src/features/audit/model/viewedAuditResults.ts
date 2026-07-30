// "결과 확인" 버튼을 실제로 눌러본 감사만 홈 화면 "최근 감사 이력"에 노출하기 위한
// 로컬 기록이다. 백엔드에 열람 여부 필드가 없어 브라우저에만 저장하며, 다른 브라우저·
// 기기에서는 다시 나타날 수 있다 — 그 정도는 감수할 수 있는 사소한 UX 트레이드오프다.
const STORAGE_KEY = 'audit-viewed-result-ids';

function readStoredIds(): number[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

export function getViewedAuditResultIds(): Set<number> {
  return new Set(readStoredIds());
}

export function markAuditResultsViewed(auditId: number): void {
  try {
    const ids = new Set(readStoredIds());
    ids.add(auditId);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // 프라이빗 모드 등으로 localStorage를 못 쓰는 경우, 이 기능만 조용히 무시한다.
  }
}