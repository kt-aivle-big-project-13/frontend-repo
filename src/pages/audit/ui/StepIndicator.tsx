import './StepIndicator.css';

const STEPS = [
  { step: 1, label: 'STEP1 고영향 AI 사전진단' },
  { step: 2, label: 'STEP2 모델 업로드' },
  { step: 3, label: 'STEP3 체크리스트 작성' },
  { step: 4, label: 'STEP4 결과물 및 보고서 다운로드' },
];

interface StepIndicatorProps {
  doneSteps?: number[];
  activeSteps?: number[];
}

function StepIndicator({ doneSteps = [], activeSteps = [] }: StepIndicatorProps) {
  return (
    <ol className="step-indicator">
      {STEPS.map(({ step, label }) => {
        const status = doneSteps.includes(step)
          ? 'done'
          : activeSteps.includes(step)
            ? 'active'
            : 'pending';

        return (
          <li key={step} className="step-indicator__item">
            <span className={`step-indicator__pill step-indicator__pill--${status}`}>
              {label}
            </span>
            {step < STEPS.length && (
              <span className="step-indicator__line" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default StepIndicator;