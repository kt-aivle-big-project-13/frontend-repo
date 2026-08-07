import { describe, expect, it } from 'vitest';

import type { FairlearnResultItem } from '../../../../features/audit/api/auditApi';

import {
  ATTRIBUTE_LABEL,
  getAttributeLabel,
  getFairnessStatusCounts,
  groupByAttribute,
  listAttributes,
} from './fairnessData';

function item(overrides: Partial<FairlearnResultItem> = {}): FairlearnResultItem {
  return {
    attribute: 'CODE_GENDER',
    metricCode: 'DEMOGRAPHIC_PARITY',
    value: 0.1,
    threshold: 0.2,
    status: 'PASS',
    note: null,
    ...overrides,
  };
}

describe('groupByAttribute', () => {
  it('속성별로 지표코드를 키로 묶는다', () => {
    const grouped = groupByAttribute([
      item({ attribute: 'CODE_GENDER', metricCode: 'DEMOGRAPHIC_PARITY' }),
      item({ attribute: 'CODE_GENDER', metricCode: 'EQUAL_OPPORTUNITY' }),
      item({ attribute: 'AGE_GROUP', metricCode: 'DEMOGRAPHIC_PARITY' }),
    ]);

    expect([...grouped.keys()]).toEqual(['CODE_GENDER', 'AGE_GROUP']);
    expect(grouped.get('CODE_GENDER')?.size).toBe(2);
    expect(grouped.get('AGE_GROUP')?.get('DEMOGRAPHIC_PARITY')?.value).toBe(0.1);
  });

  it('같은 속성·지표코드가 중복되면 마지막 값으로 덮어쓴다', () => {
    const grouped = groupByAttribute([
      item({ value: 0.1 }),
      item({ value: 0.9 }),
    ]);

    expect(grouped.get('CODE_GENDER')?.get('DEMOGRAPHIC_PARITY')?.value).toBe(0.9);
  });
});

describe('listAttributes', () => {
  it('알려진 변수를 먼저 두고 나머지는 응답에 나온 순서를 따른다', () => {
    const list = listAttributes([
      item({ attribute: 'OCCUPATION_TYPE' }),
      item({ attribute: 'CODE_GENDER' }),
      item({ attribute: 'REGION' }),
    ]);

    expect(list).toEqual(['CODE_GENDER', 'OCCUPATION_TYPE', 'REGION']);
  });

  it('여러 버전을 넘기면 합집합을 만든다', () => {
    const previous = [item({ attribute: 'CODE_GENDER' })];
    const latest = [item({ attribute: 'AGE_GROUP' })];

    expect(listAttributes(previous, latest)).toEqual(['AGE_GROUP', 'CODE_GENDER']);
  });

  it('중복 없이 한 번씩만 담는다', () => {
    const results = [
      item({ attribute: 'CODE_GENDER', metricCode: 'DEMOGRAPHIC_PARITY' }),
      item({ attribute: 'CODE_GENDER', metricCode: 'EQUAL_OPPORTUNITY' }),
    ];

    expect(listAttributes(results)).toEqual(['CODE_GENDER']);
  });

  it('Object.prototype에 이미 있는 이름(toString 등)도 목록에서 사라지지 않는다', () => {
    expect(listAttributes([item({ attribute: 'toString' })])).toEqual(['toString']);
    expect(listAttributes([item({ attribute: 'constructor' })])).toEqual(['constructor']);
  });

  it('결과가 비어 있으면 빈 목록을 돌려준다', () => {
    expect(listAttributes([])).toEqual([]);
  });
});

describe('getAttributeLabel', () => {
  it('등록된 속성은 한글 라벨을 돌려준다', () => {
    expect(getAttributeLabel('CODE_GENDER')).toBe(ATTRIBUTE_LABEL.CODE_GENDER);
  });

  it('라벨 맵에 없는 속성은 컬럼명을 그대로 돌려준다', () => {
    expect(getAttributeLabel('OCCUPATION_TYPE')).toBe('OCCUPATION_TYPE');
  });

  it('Object.prototype에 있는 이름은 그 값이 아니라 컬럼명을 돌려준다', () => {
    // 대괄호 접근을 그냥 쓰면 함수(Object.prototype.toString)가 나온다.
    expect(getAttributeLabel('toString')).toBe('toString');
    expect(getAttributeLabel('hasOwnProperty')).toBe('hasOwnProperty');
  });
});

describe('getFairnessStatusCounts', () => {
  it('상태 코드별로 센다', () => {
    const counts = getFairnessStatusCounts([
      item({ metricCode: 'DEMOGRAPHIC_PARITY', status: 'PASS' }),
      item({ metricCode: 'EQUAL_OPPORTUNITY', status: 'REVIEW' }),
      item({ metricCode: 'EQUALIZED_ODDS', status: 'FAIL' }),
    ]);

    expect(counts.pass).toBe(1);
    expect(counts.review).toBe(1);
    expect(counts.fail).toBe(1);
  });

  it('지표코드 7개 중 없는 만큼 계산불가로 센다', () => {
    // COLUMN_ORDER 7개 중 1개만 채웠으니 나머지 6개가 na.
    const counts = getFairnessStatusCounts([item({ metricCode: 'DEMOGRAPHIC_PARITY' })]);

    expect(counts.na).toBe(6);
  });

  it('속성 목록을 생략하면 결과에 실제로 있는 속성만 기준으로 삼는다', () => {
    const counts = getFairnessStatusCounts([item({ attribute: 'CODE_GENDER' })]);

    // CODE_GENDER 하나 × 7개 지표코드 = 7칸. 다른 속성은 세지 않는다.
    expect(counts.pass + counts.review + counts.fail + counts.na).toBe(7);
  });

  it('속성 목록을 넘기면 결과에 없는 속성도 전부 계산불가로 센다', () => {
    // 비교보기처럼 두 버전 합집합을 넘기는 경우: 이 버전엔 AGE_GROUP 결과가 없어도
    // 합집합에 있으면 그만큼 계산불가로 잡혀야 표와 분포 숫자가 어긋나지 않는다.
    const counts = getFairnessStatusCounts(
      [item({ attribute: 'CODE_GENDER' })],
      ['CODE_GENDER', 'AGE_GROUP'],
    );

    expect(counts.na).toBe(6 + 7);
  });

  it('결과가 없으면 전부 0이다', () => {
    expect(getFairnessStatusCounts([])).toEqual({ pass: 0, review: 0, fail: 0, na: 0 });
  });
});
