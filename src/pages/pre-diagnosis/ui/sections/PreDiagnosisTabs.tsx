import type { AssessmentStep } from '../../../../features/pre-diagnosis/model/assessmentModel';

const PRE_DIAGNOSIS_TABS = [
  {
    step: 'stage1',
    number: 1,
    label: '정성 게이트',
  },
  {
    step: 'stage2',
    number: 2,
    label: '정량 배점',
  },
  {
    step: 'result',
    number: 3,
    label: '판정 결과',
  },
] as const;

function getTabStatus(
  tabStep: AssessmentStep,
  currentStep: AssessmentStep,
): 'active' | 'next' | 'inactive' {
  const currentIndex = PRE_DIAGNOSIS_TABS.findIndex(
    (tab) => tab.step === currentStep,
  );
  const tabIndex = PRE_DIAGNOSIS_TABS.findIndex((tab) => tab.step === tabStep);

  if (tabIndex === currentIndex) {
    return 'active';
  }

  if (tabIndex === currentIndex + 1) {
    return 'next';
  }

  return 'inactive';
}

function PreDiagnosisTabs({ currentStep }: { currentStep: AssessmentStep }) {
  return (
    <div
      className="pre-diagnosis-page__tabs"
      aria-label="사전진단 내부 단계"
    >
      {PRE_DIAGNOSIS_TABS.map((tab) => (
        <span
          key={tab.step}
          className={`pre-diagnosis-page__tab pre-diagnosis-page__tab--${getTabStatus(
            tab.step,
            currentStep,
          )}`}
        >
          <span className="pre-diagnosis-page__tab-number">{tab.number}</span>
          {tab.label}
        </span>
      ))}
    </div>
  );
}

export default PreDiagnosisTabs;
