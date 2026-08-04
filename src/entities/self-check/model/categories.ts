import type { SelfCheckCategory } from './types';

// 문서 2장 그룹 코드 7종 — 조문 구조를 그대로 따르므로 임의 재분류 금지.
export const CATEGORY_ORDER: SelfCheckCategory[] = [
  'TRANSPARENCY',
  'RISK',
  'USER',
  'OVERSIGHT',
  'DOCUMENT',
  'IMPACT',
  'SCOPE',
];

export interface CategoryMeta {
  shortCode: string;
  label: string;
  articleHint: string;
}

export const CATEGORY_META: Record<SelfCheckCategory, CategoryMeta> = {
  TRANSPARENCY: { shortCode: 'TR', label: '투명성 확보', articleHint: '제31조·제34조①2호' },
  RISK: { shortCode: 'RM', label: '위험관리', articleHint: '제34조①1호·제34조①6호' },
  USER: { shortCode: 'UP', label: '이용자 보호', articleHint: '제34조①3호' },
  OVERSIGHT: { shortCode: 'HO', label: '사람의 관리·감독', articleHint: '제34조①4호' },
  DOCUMENT: { shortCode: 'DC', label: '문서 작성·보관', articleHint: '제34조①5호·제36조①3호' },
  IMPACT: { shortCode: 'IA', label: '영향평가', articleHint: '제35조①' },
  SCOPE: {
    shortCode: 'SC',
    label: '적용범위·사업자 지위',
    articleHint: '제2조7호·제30조③·제32조①·제34조③·제36조①',
  },
};

export const OBLIGATION_LABEL: Record<string, string> = {
  MANDATORY: '의무',
  EFFORT: '노력의무',
  CONDITION: '조건부',
  PREMISE: '전제',
};
