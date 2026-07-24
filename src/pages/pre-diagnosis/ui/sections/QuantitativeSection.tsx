import type {
  AssessmentStep,
  QuantitativeAnswers,
  YesNo,
} from '../../../../features/pre-diagnosis/model/assessmentModel';

import PreDiagnosisTabs from './PreDiagnosisTabs';

const QUANTITATIVE_QUESTION_GROUPS = [
  {
    group: 'A그룹',
    scoreLabel: '문항당 2점',
    questions: [
      {
        code: 'A_01',
        title:
          'AI 모델의 복잡도가 기존보다 증가한 신규 모델(블랙박스 등)에 기반한 시스템인가요?',
        description:
          '기존 모델보다 파라미터, 학습 데이터 규모 또는 구조가 복잡해진 AI 모델인지 확인합니다.',
      },
      {
        code: 'A_02',
        title: '1만 명 이상의 금융소비자를 대상으로 하는 AI 시스템인가요?',
        description:
          '다수의 금융소비자를 대상으로 서비스를 제공하거나 의사결정에 활용되는 AI인지 확인합니다.',
      },
      {
        code: 'A_03',
        title: 'AI 결과가 사람의 실질적인 개입 없이 최종 의사결정으로 이어지나요?',
        description:
          'AI의 판단이 승인·거절 등 최종 결정에 직접 반영되는지 확인합니다.',
      },
    ],
  },
  {
    group: 'B그룹',
    scoreLabel: '문항당 1점',
    questions: [
      {
        code: 'B_01',
        title: '대리변수(Proxy Variable)를 자주 활용하는 AI 시스템인가요?',
        description:
          '민감정보를 간접적으로 추론할 수 있는 대리변수를 사용하는지 확인합니다.',
      },
      {
        code: 'B_02',
        title: '특정 업무용으로 개발된 AI를 다른 업무에 일시적으로 활용하고 있나요?',
        description:
          '특정 목적의 AI를 다른 업무나 서비스에 재사용하는지 확인합니다.',
      },
      {
        code: 'B_03',
        title: '국외 데이터를 주로 학습한 해외 AI 시스템을 활용하고 있나요?',
        description:
          '해외에서 개발되었거나 국외 데이터를 기반으로 학습된 AI를 사용하는지 확인합니다.',
      },
    ],
  },
] as const;

interface QuantitativeSectionProps {
  currentStep: AssessmentStep;
  answers: QuantitativeAnswers;
  errorMessage: string;
  isSubmitting: boolean;
  onChangeAnswer: (questionCode: keyof QuantitativeAnswers, answer: YesNo) => void;
  onSubmit: () => void;
}

function QuantitativeSection({
  currentStep,
  answers,
  errorMessage,
  isSubmitting,
  onChangeAnswer,
  onSubmit,
}: QuantitativeSectionProps) {
  return (
    <div className="pre-diagnosis-page__step-card">
      <div className="pre-diagnosis-page__step-header">
        <span className="pre-diagnosis-page__step-badge">Step 2</span>
        <div>
          <h2 className="pre-diagnosis-page__step-title">정량 배점</h2>
          <p className="pre-diagnosis-page__step-description">
            A그룹은 문항당 2점, B그룹은 문항당 1점으로 계산됩니다. 최종
            판정은 백엔드 응답 결과를 기준으로 표시합니다.
          </p>
          <PreDiagnosisTabs currentStep={currentStep} />
        </div>
      </div>

      <div className="pre-diagnosis-page__question-groups">
        {QUANTITATIVE_QUESTION_GROUPS.map((questionGroup) => (
          <section
            key={questionGroup.group}
            className="pre-diagnosis-page__question-group"
          >
            <div className="pre-diagnosis-page__question-group-header">
              <span className="pre-diagnosis-page__group-name">
                {questionGroup.group}
              </span>
              <span className="pre-diagnosis-page__group-score">
                {questionGroup.scoreLabel}
              </span>
            </div>

            <div className="pre-diagnosis-page__questions pre-diagnosis-page__questions--compact">
              {questionGroup.questions.map((question) => {
                const selectedAnswer = answers[question.code];

                return (
                  <article
                    key={question.code}
                    className="pre-diagnosis-page__question"
                  >
                    <div className="pre-diagnosis-page__question-text">
                      <div>
                        <h3 className="pre-diagnosis-page__question-title">
                          {question.title}
                        </h3>
                        <p className="pre-diagnosis-page__question-description">
                          {question.description}
                        </p>
                      </div>
                    </div>

                    <div
                      className="pre-diagnosis-page__answer-group"
                      aria-label={`${question.title} 답변`}
                    >
                      <button
                        type="button"
                        className={
                          selectedAnswer === 'YES'
                            ? 'pre-diagnosis-page__answer pre-diagnosis-page__answer--selected'
                            : 'pre-diagnosis-page__answer'
                        }
                        onClick={() => onChangeAnswer(question.code, 'YES')}
                      >
                        예
                      </button>
                      <button
                        type="button"
                        className={
                          selectedAnswer === 'NO'
                            ? 'pre-diagnosis-page__answer pre-diagnosis-page__answer--selected'
                            : 'pre-diagnosis-page__answer'
                        }
                        onClick={() => onChangeAnswer(question.code, 'NO')}
                      >
                        아니요
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {errorMessage && (
        <p className="pre-diagnosis-page__error" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="pre-diagnosis-page__actions">
        <button
          type="button"
          className="pre-diagnosis-page__submit"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? '제출 중...' : '결과확인'}
        </button>
      </div>
    </div>
  );
}

export default QuantitativeSection;
