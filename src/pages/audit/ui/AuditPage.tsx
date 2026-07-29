import { useParams } from 'react-router-dom';

import MainLayout from '../../../widgets/layout/ui/MainLayout';

import AuditExecutionSection from './sections/AuditExecutionSection';
import './AuditPage.css';

function AuditPage() {
  const { auditId: auditIdParam } = useParams<{ auditId?: string }>();
  const parsedAuditId = auditIdParam !== undefined ? Number(auditIdParam) : NaN;
  const viewAuditId = Number.isFinite(parsedAuditId) ? parsedAuditId : undefined;

  return (
    <MainLayout>
      <div className="audit-page">
        <header className="audit-page__header">
          <h1 className="audit-page__title">
            {viewAuditId != null ? '감사 결과' : '모델 감사 실행'}
          </h1>
        </header>

        <AuditExecutionSection viewAuditId={viewAuditId} />
      </div>
    </MainLayout>
  );
}

export default AuditPage;