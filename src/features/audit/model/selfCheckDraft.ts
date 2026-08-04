import type { SelfCheckAnswer } from '../../../entities/self-check/model';

// 백엔드가 아직 21문항·NA를 저장할 수 없어(selfCheckLegacyMapping 참고), 감사당 21문항 전체
// 응답을 브라우저에만 임시로 들고 있는다. 21문항 백엔드 연동이 끝나면 이 파일도 함께 제거하고
// getSelfCheckAnswers/saveSelfCheckAnswers로 완전히 옮기면 된다.
const STORAGE_KEY = 'audit-self-check-draft';

export type SelfCheckDraft = Record<string, SelfCheckAnswer>;

function readStore(): Record<string, SelfCheckDraft> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, SelfCheckDraft>) : {};
  } catch {
    return {};
  }
}

export function getSelfCheckDraft(auditId: number): SelfCheckDraft {
  return readStore()[String(auditId)] ?? {};
}

export function saveSelfCheckDraft(auditId: number, draft: SelfCheckDraft): void {
  try {
    const store = readStore();
    store[String(auditId)] = draft;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // 프라이빗 모드 등으로 localStorage를 못 쓰는 경우, 이 기능만 조용히 무시한다.
  }
}

export function clearSelfCheckDraft(auditId: number): void {
  try {
    const store = readStore();
    delete store[String(auditId)];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // 위와 동일한 이유로 조용히 무시한다.
  }
}
