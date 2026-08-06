import { describe, expect, it } from 'vitest';

import { FEATURE_LABEL, getFeatureLabel } from './featureData';

describe('getFeatureLabel', () => {
  it('등록된 컬럼은 한글 라벨을 돌려준다', () => {
    expect(getFeatureLabel('CODE_GENDER')).toBe(FEATURE_LABEL.CODE_GENDER);
  });

  it('등록되지 않은 컬럼은 undefined를 돌려준다', () => {
    // TopFeaturesCard가 이 값을 ?? feature 로 폴백하므로 undefined여야 한다 — 빈 문자열이면
    // 안 보이고, 원본 문자열을 그대로 돌려주면 "등록됨"과 구분이 안 된다.
    expect(getFeatureLabel('CUSTOM_UPLOADED_COLUMN')).toBeUndefined();
  });

  it('Object.prototype에 있는 이름은 그 값이 아니라 undefined를 돌려준다', () => {
    // 대괄호 접근을 그냥 쓰면 FEATURE_LABEL['toString']이 함수를 돌려준다.
    expect(getFeatureLabel('toString')).toBeUndefined();
    expect(getFeatureLabel('constructor')).toBeUndefined();
    expect(getFeatureLabel('hasOwnProperty')).toBeUndefined();
  });
});
