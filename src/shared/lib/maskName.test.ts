import { describe, expect, it } from 'vitest';

import { maskName } from './maskName';

describe('maskName', () => {
  it('한 글자 이하면 그대로 둔다', () => {
    expect(maskName('김')).toBe('김');
    expect(maskName('')).toBe('');
  });

  it('두 글자면 마지막 한 글자만 가린다', () => {
    expect(maskName('김철')).toBe('김*');
  });

  it('세 글자 이상이면 앞 두 글자만 남기고 별표 하나로 가린다', () => {
    expect(maskName('김철수')).toBe('김철*');
    expect(maskName('김철수영')).toBe('김철*');
  });
});
