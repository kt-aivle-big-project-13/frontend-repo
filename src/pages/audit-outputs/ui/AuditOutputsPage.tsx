import MainLayout from '../../../widgets/layout/ui/MainLayout';

import ComplianceStatusSection from './sections/ComplianceStatusSection';
import DeliverablesSection from './sections/DeliverablesSection';
import VersionHistorySection from './sections/VersionHistorySection';
import './AuditOutputsPage.css';

function AuditOutputsPage() {
  return (
    <MainLayout>
      <div className="audit-outputs-page">
        <header className="audit-outputs-page__header">
          <div>
            {/* TODO: 실제 감사 이력 API 연동 후 모델명·버전을 그 응답값으로 교체 */}
            <p className="audit-outputs-page__model">A모델(v2)</p>
            <h1 className="audit-outputs-page__title">산출물 (보고서) 관리</h1>
          </div>

          <div className="audit-outputs-page__final">
            <button
              type="button"
              className="audit-outputs-page__final-button"
            >
              최종 보고서 다운로드
            </button>
            <p className="audit-outputs-page__final-note">
              4종 보고서를 하나로 묶은 종합 보고서입니다.
            </p>
          </div>
        </header>

        <DeliverablesSection />
        <ComplianceStatusSection />
        <VersionHistorySection />
      </div>
    </MainLayout>
  );
}

export default AuditOutputsPage;
