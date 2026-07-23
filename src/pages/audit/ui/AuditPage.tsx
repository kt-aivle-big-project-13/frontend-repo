import { useState } from 'react';

import MainLayout from '../../../widgets/layout/ui/MainLayout';

import AuditExecutionSection from './sections/AuditExecutionSection';
import PreDiagnosisSection from './sections/PreDiagnosisSection';
import StepIndicator from './StepIndicator';
import './AuditPage.css';

type AuditStage = 'diagnosis' | 'execution';

function AuditPage() {
  const [stage, setStage] = useState<AuditStage>('diagnosis');

  return (
    <MainLayout>
      <div className="audit-page">
        {stage === 'diagnosis' ? (
          <>
            <header className="audit-page__header">
              <h1 className="audit-page__title">고영향 AI 사전진단</h1>
            </header>

            <StepIndicator activeSteps={[1]} />

            <PreDiagnosisSection
              onProceed={() => setStage('execution')}
            />
          </>
        ) : (
          <>
            <header className="audit-page__header">
              <h1 className="audit-page__title">모델 감사 실행</h1>
            </header>

            <AuditExecutionSection />
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default AuditPage;
