import { useParams } from 'react-router-dom';

import MainLayout from '../../../widgets/layout/ui/MainLayout';

import AuditChecklistSection from './sections/AuditChecklistSection';
import AuditExecutionSection from './sections/AuditExecutionSection';
import AuditResultsSection from './sections/AuditResultsSection';
import './AuditPage.css';

export type AuditPageMode = 'upload' | 'checklist' | 'results';

const PAGE_TITLE: Record<AuditPageMode, string> = {
  upload: '모델 감사 실행',
  checklist: '감사 진행 및 자가 점검',
  results: '결과물 및 보고서 다운로드',
};

interface AuditPageProps {
  mode: AuditPageMode;
}

function AuditPage({ mode }: AuditPageProps) {
  const { auditId: auditIdParam } = useParams<{ auditId?: string }>();
  const parsedAuditId = auditIdParam !== undefined ? Number(auditIdParam) : NaN;
  const auditId = Number.isFinite(parsedAuditId) ? parsedAuditId : undefined;

  return (
    <MainLayout>
      <div className="audit-page">
        <div className="audit-page__inner">
          <header className="audit-page__header">
            <h1 className="audit-page__title">{PAGE_TITLE[mode]}</h1>
          </header>

          {mode === 'upload' && <AuditExecutionSection />}
          {mode === 'checklist' && auditId != null && (
            <AuditChecklistSection auditId={auditId} />
          )}
          {mode === 'results' && auditId != null && (
            <AuditResultsSection auditId={auditId} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default AuditPage;