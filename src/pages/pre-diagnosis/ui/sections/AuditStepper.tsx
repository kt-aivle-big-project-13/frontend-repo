const AUDIT_STEPS = [
  '고영향 AI 사전진단',
  '모델 업로드',
  '체크리스트 작성',
  '결과물 및 보고서 다운로드',
] as const;

function AuditStepper() {
  return (
    <ol
      className="pre-diagnosis-page__audit-stepper"
      aria-label="감사 진행 단계"
    >
      {AUDIT_STEPS.map((stepLabel, index) => (
        <li
          key={stepLabel}
          className={
            index === 0
              ? 'pre-diagnosis-page__audit-step pre-diagnosis-page__audit-step--active'
              : 'pre-diagnosis-page__audit-step'
          }
        >
          <span className="pre-diagnosis-page__audit-step-text">
            <span className="pre-diagnosis-page__audit-step-number">
              STEP{index + 1}
            </span>
            <span className="pre-diagnosis-page__audit-step-label">
              {stepLabel}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export default AuditStepper;