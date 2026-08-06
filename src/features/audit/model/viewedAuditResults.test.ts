import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getViewedAuditResultIds, markAuditResultsViewed } from './viewedAuditResults';

// environment: 'node' 라 window가 없다. 이 모듈은 window.localStorage 를 직접 참조하므로
// 최소한의 인메모리 Storage 를 만들어 전역에 주입한다.
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe('viewedAuditResults', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: createMemoryStorage() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('처음에는 열람한 감사가 없다', () => {
    expect(getViewedAuditResultIds()).toEqual(new Set());
  });

  it('열람 처리하면 이후 조회에 포함된다', () => {
    markAuditResultsViewed(42);

    expect(getViewedAuditResultIds()).toEqual(new Set([42]));
  });

  it('여러 번 표시해도 누적된다', () => {
    markAuditResultsViewed(1);
    markAuditResultsViewed(2);
    markAuditResultsViewed(1);

    expect(getViewedAuditResultIds()).toEqual(new Set([1, 2]));
  });

  it('저장된 값이 손상된 JSON이면 빈 목록으로 취급한다', () => {
    window.localStorage.setItem('audit-viewed-result-ids', '{not json');

    expect(getViewedAuditResultIds()).toEqual(new Set());
  });

  it('숫자가 아닌 값이 섞여 있으면 걸러낸다', () => {
    window.localStorage.setItem('audit-viewed-result-ids', JSON.stringify([1, 'two', 3, null]));

    expect(getViewedAuditResultIds()).toEqual(new Set([1, 3]));
  });

  it('localStorage 접근이 실패해도(프라이빗 모드 등) 조용히 무시한다', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('SecurityError');
        },
        setItem: () => {
          throw new Error('SecurityError');
        },
      },
    });

    expect(getViewedAuditResultIds()).toEqual(new Set());
    expect(() => markAuditResultsViewed(1)).not.toThrow();
  });
});
