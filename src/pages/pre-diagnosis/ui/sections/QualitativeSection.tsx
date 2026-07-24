import type {
  AssessmentStep,
  QualitativeAnswers,
  YesNo,
} from '../../../../features/pre-diagnosis/model/assessmentModel';

import PreDiagnosisTabs from './PreDiagnosisTabs';

const QUALITATIVE_QUESTIONS = [
  {
    code: 'GATE_01',
    title: '국민의 생명, 신체의 안전 또는 기본권에 중대한 영향을 미칠 수 있나요?',
    description:
      'AI 모델의 판단 결과가 금융 이용자의 권리, 의무, 접근 가능성에 직접적인 영향을 주는지 확인합니다.',
  },
  {
    code: 'GATE_02',
    title: '금융 거래, 신용 평가 등 중요 의사결정에 활용되나요?',
    description:
      '신용 평가, 대출 심사, 한도 산정처럼 이용자에게 실질적인 영향을 주는 업무에 사용되는지 확인합니다.',
  },
] as const;

interface QualitativeSectionProps {
  currentStep: AssessmentStep;
  answers: QualitativeAnswers;
  errorMessage: string;
  isStartingAssessment: boolean;
  isSubmitting: boolean;
  onChangeAnswer: (questionCode: keyof QualitativeAnswers, answer: YesNo) => void;
  onSubmit: () => void;
}

function QualitativeSection({
  currentStep,
  answers,
  errorMessage,
  isStartingAssessment,
  isSubmitting,
  onChangeAnswer,
  onSubmit,
}: QualitativeSectionProps) {
  return (
    <div className="pre-diagnosis-page__step-card">
      <div className="pre-diagnosis-page__step-header">
        <span className="pre-diagnosis-page__step-badge">Step 1</span>
        <div>
          <h2 className="pre-diagnosis-page__step-title">정성 게이트</h2>
          <p className="pre-diagnosis-page__step-description">
            두 문항에 모두 응답하면 판정 후 결과에 따라 고영향 AI 여부
            또는 정량 배점 단계로 이동합니다.
          </p>
          <PreDiagnosisTabs currentStep={currentStep} />
        </div>
      </div>

      <div className="pre-diagnosis-page__questions">
        {QUALITATIVE_QUESTIONS.map((question, index) => {
          const selectedAnswer = answers[question.code];

          return (
            <article
              key={question.code}
              className="pre-diagnosis-page__question"
            >
              <div className="pre-diagnosis-page__question-text">
                <span className="pre-diagnosis-page__question-number">
                  {index + 1}
                </span>
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
          disabled={isStartingAssessment || isSubmitting}
        >
          {isSubmitting ? '제출 중...' : '다음 단계'}
        </button>
      </div>
    </div>
  );
}

export default QualitativeSection;
