import './StepIndicator.css';

const STEPS = [
  { step: 1, label: 'STEP1 고영향 AI 사전진단' },
  { step: 2, label: 'STEP2 SHAP 설명가능성' },
  { step: 3, label: 'STEP3 Fairlearn 공정성' },
  { step: 4, label: 'STEP4 RAG 법조문 매칭' },
  { step: 5, label: 'STEP5 LLM 보고서' },
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
