import type { AssessmentAnswer } from '../api/impactAssessmentApi';

export type YesNo = 'YES' | 'NO' | null;

export type AssessmentStep = 'stage1' | 'stage2' | 'result';

export type AssessmentResultSource = 'qualitative' | 'quantitative';

export interface QualitativeAnswers {
  GATE_01: YesNo;
  GATE_02: YesNo;
}

export interface QuantitativeAnswers {
  A_01: YesNo;
  A_02: YesNo;
  A_03: YesNo;
  B_01: YesNo;
  B_02: YesNo;
  B_03: YesNo;
}

export const INITIAL_QUALITATIVE_ANSWERS: QualitativeAnswers = {
  GATE_01: null,
  GATE_02: null,
};

export const INITIAL_QUANTITATIVE_ANSWERS: QuantitativeAnswers = {
  A_01: null,
  A_02: null,
  A_03: null,
  B_01: null,
  B_02: null,
  B_03: null,
};

export function areQualitativeAnswersComplete(
  answers: QualitativeAnswers,
): boolean {
  return Object.values(answers).every((answer) => answer !== null);
}

export function areQuantitativeAnswersComplete(
  answers: QuantitativeAnswers,
): boolean {
  return Object.values(answers).every((answer) => answer !== null);
}

export function toStage1Answers(
  answers: QualitativeAnswers,
): AssessmentAnswer[] {
  return [
    {
      questionCode: 'GATE_01',
      answer: answers.GATE_01 === 'YES',
    },
    {
      questionCode: 'GATE_02',
      answer: answers.GATE_02 === 'YES',
    },
  ];
}

export function toStage2Answers(
  answers: QuantitativeAnswers,
): AssessmentAnswer[] {
  return Object.entries(answers).map(([questionCode, answer]) => ({
    questionCode,
    answer: answer === 'YES',
  }));
}
