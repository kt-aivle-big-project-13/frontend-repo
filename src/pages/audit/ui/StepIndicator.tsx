import type { ReactNode } from 'react';

import './StepIndicator.css';

const STEPS = [
  { step: 1, label: 'STEP1 고영향 AI 사전진단' },
  { step: 2, label: 'STEP2 모델 업로드' },
  { step: 3, label: 'STEP3 감사 진행 및 자가 점검' },
  { step: 4, label: 'STEP4 결과물 및 보고서 다운로드' },
];

interface StepIndicatorProps {
  doneSteps?: number[];
  activeSteps?: number[];
}

function StepIndicator({ doneSteps = [], activeSteps = [] }: StepIndicatorProps) {
  // pill과 연결선을 같은 <li> 안에 묶으면 각 구간이 flex:1로 폭을 동일하게 나눠 갖게 되어,
  // 라벨이 긴 STEP일수록 연결선이 짧아지는 등 간격이 들쭉날쭉해진다. pill(내용 크기만큼)과
  // 연결선(남는 공간을 균등하게 나눠 가짐)을 독립된 flex 아이템으로 분리해 간격을 맞춘다.
  const items: ReactNode[] = [];

  STEPS.forEach(({ step, label }, index) => {
    const status = doneSteps.includes(step)
      ? 'done'
      : activeSteps.includes(step)
        ? 'active'
        : 'pending';

    items.push(
      <li key={step} className="step-indicator__item">
        <span className={`step-indicator__pill step-indicator__pill--${status}`}>
          {label}
        </span>
      </li>,
    );

    if (index < STEPS.length - 1) {
      items.push(
        <li key={`line-${step}`} className="step-indicator__line" aria-hidden="true" />,
      );
    }
  });

  return <ol className="step-indicator">{items}</ol>;
}

export default StepIndicator;