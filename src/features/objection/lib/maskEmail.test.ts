import { describe, expect, it } from 'vitest';

import { maskEmail } from './maskEmail';

// 이의제기 화면(ObjectionDetailPanel 등)에서 쓰는 버전. 앞 2자만 남기고 나머지는 최소 3개의
// 별표로 가린다 — shared/lib/maskEmail.ts 와는 규칙이 다르다. 이름이 같은 서로 다른 함수라
// 각자 실제 동작을 그대로 검증한다.
describe('maskEmail', () => {
  it('아이디 앞 두 글자만 남기고 나머지 길이만큼 가린다', () => {
    expect(maskEmail('duke@naver.com')).toBe('du***@naver.com');
  });

  it('가려지는 글자 수가 실제 길이와 상관없이 최소 3개다', () => {
    // "실제 길이가 드러나지 않게" 짧은 아이디도 별표 3개로 채운다.
    expect(maskEmail('ab@naver.com')).toBe('ab***@naver.com');
    expect(maskEmail('a@naver.com')).toBe('a***@naver.com');
  });

  it('아이디가 길면 남는 글자 수만큼 별표가 늘어난다', () => {
    expect(maskEmail('abcdef@naver.com')).toBe('ab****@naver.com');
  });

  it('@가 없으면 그대로 둔다', () => {
    expect(maskEmail('not-an-email')).toBe('not-an-email');
  });

  it('@로 시작하면 그대로 둔다', () => {
    expect(maskEmail('@naver.com')).toBe('@naver.com');
  });
});
