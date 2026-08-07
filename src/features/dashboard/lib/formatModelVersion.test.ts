import { describe, expect, it } from 'vitest';

import { formatModelVersion } from './formatModelVersion';

describe('formatModelVersion', () => {
  it('v가 없으면 앞에 붙인다', () => {
    expect(formatModelVersion('2.1.0')).toBe('v2.1.0');
  });

  it('이미 v로 시작하면 그대로 둔다', () => {
    expect(formatModelVersion('v2.1.0')).toBe('v2.1.0');
  });

  it('대문자 V도 v로 취급하고 원래 대소문자를 유지한다', () => {
    expect(formatModelVersion('V2')).toBe('V2');
  });

  it('앞뒤 공백을 지운다', () => {
    expect(formatModelVersion('  3.0  ')).toBe('v3.0');
  });

  it('빈 문자열이나 공백만 있으면 빈 문자열을 돌려준다', () => {
    expect(formatModelVersion('')).toBe('');
    expect(formatModelVersion('   ')).toBe('');
  });
});
