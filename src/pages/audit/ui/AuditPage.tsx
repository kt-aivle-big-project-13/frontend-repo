import MainLayout from '../../../widgets/layout/ui/MainLayout';

import AuditExecutionSection from './sections/AuditExecutionSection';
import './AuditPage.css';

function AuditPage() {
  return (
    <MainLayout>
      <div className="audit-page">
        <header className="audit-page__header">
          <h1 className="audit-page__title">모델 감사 실행</h1>
        </header>

        <AuditExecutionSection />
      </div>
    </MainLayout>
  );
}

export default AuditPage;