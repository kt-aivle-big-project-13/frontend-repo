import { describe, expect, it } from 'vitest';

import { maskEmail } from './maskEmail';

// 마이페이지(AccountInfoCard 등)에서 쓰는 버전. 아이디 뒷부분 2자를 가린다 — 이의제기 쪽의
// features/objection/lib/maskEmail.ts 와는 가리는 규칙이 다르다(그쪽은 앞 2자만 남기고
// 나머지 전부 별표). 같은 이름의 서로 다른 두 함수라 각자 실제 동작을 그대로 검증한다.
describe('maskEmail', () => {
  it('아이디의 마지막 두 글자를 가린다', () => {
    expect(maskEmail('duke@example.com')).toBe('du**@example.com');
  });

  it('아이디가 2자 이하면 그대로 둔다', () => {
    expect(maskEmail('ab@example.com')).toBe('ab@example.com');
    expect(maskEmail('a@example.com')).toBe('a@example.com');
  });

  it('@가 없으면 그대로 둔다', () => {
    expect(maskEmail('not-an-email')).toBe('not-an-email');
  });
});
