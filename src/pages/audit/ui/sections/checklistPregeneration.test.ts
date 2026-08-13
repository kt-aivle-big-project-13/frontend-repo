import { describe, expect, it } from 'vitest';

import {
  isSkipSelfCheckDisabled,
  shouldPregenerateSkippedReports,
} from './checklistPregeneration';

describe('shouldPregenerateSkippedReports', () => {
  it('건너뛰고 제출도 안 했으면 프론트가 사전 생성한다', () => {
    expect(
      shouldPregenerateSkippedReports({
        skipSelfCheck: true,
        isSelfCheckSubmitted: false,
      }),
    ).toBe(true);
  });

  it('제출한 뒤 건너뛰기를 골랐어도 사전 생성하지 않는다', () => {
    // 백엔드가 preGenerateAfterSelfCheck 로 이미 만들었으므로 중복이 된다.
    expect(
      shouldPregenerateSkippedReports({
        skipSelfCheck: true,
        isSelfCheckSubmitted: true,
      }),
    ).toBe(false);
  });

  it('건너뛰지 않았으면 사전 생성하지 않는다', () => {
    expect(
      shouldPregenerateSkippedReports({
        skipSelfCheck: false,
        isSelfCheckSubmitted: true,
      }),
    ).toBe(false);

    expect(
      shouldPregenerateSkippedReports({
        skipSelfCheck: false,
        isSelfCheckSubmitted: false,
      }),
    ).toBe(false);
  });
});

describe('isSkipSelfCheckDisabled', () => {
  it('제출을 마쳤으면 건너뛰기를 고를 수 없다', () => {
    expect(isSkipSelfCheckDisabled({ isSelfCheckSubmitted: true })).toBe(true);
  });

  it('제출 전에는 건너뛰기를 고를 수 있다', () => {
    expect(isSkipSelfCheckDisabled({ isSelfCheckSubmitted: false })).toBe(false);
  });
});
