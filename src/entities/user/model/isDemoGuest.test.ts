import { describe, expect, it } from 'vitest';

import { isDemoGuest, type User } from './authStore';

function user(email: string): User {
  return { id: 1, email, name: '게스트', role: 'USER' };
}

describe('isDemoGuest', () => {
  it('게스트 도메인 계정이면 참이다', () => {
    expect(isDemoGuest(user('guest-6f0b1c@demo.invalid'))).toBe(true);
  });

  it('일반 계정이면 거짓이다', () => {
    expect(isDemoGuest(user('someone@finaiaudit.com'))).toBe(false);
  });

  it('로그인 전(null)이면 거짓이다', () => {
    expect(isDemoGuest(null)).toBe(false);
  });

  it('도메인이 중간에 들어간 주소는 게스트가 아니다', () => {
    expect(isDemoGuest(user('demo.invalid@finaiaudit.com'))).toBe(false);
    expect(isDemoGuest(user('guest@demo.invalid.co.kr'))).toBe(false);
  });
});
