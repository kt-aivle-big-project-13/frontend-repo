export type SelfCheckAnswer = 'YES' | 'NO' | 'NA' | null;
export type AnswerType = 'YES_NO' | 'YES_NO_NA';
export type ObligationLevel = 'MANDATORY' | 'EFFORT' | 'CONDITION' | 'PREMISE';
export type SelfCheckCategory =
  | 'TRANSPARENCY'
  | 'RISK'
  | 'USER'
  | 'OVERSIGHT'
  | 'DOCUMENT'
  | 'IMPACT'
  | 'SCOPE';

export interface LawRef {
  articleKey: string;
  label: string;
}

export interface SelfCheckItem {
  code: string;
  category: SelfCheckCategory;
  question: string;
  evidenceHint: string;
  answerType: AnswerType;
  obligation: ObligationLevel;
  lawRefs: LawRef[];
  recommendation: string;
}
