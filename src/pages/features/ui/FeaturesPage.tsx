import ImpactSection from '../../../widgets/impact-section/ui/ImpactSection';
import MainLayout from '../../../widgets/layout/ui/MainLayout';

import CoreFeaturesSection from './sections/CoreFeaturesSection';
import FeatureShowcaseSection from './sections/FeatureShowcaseSection';
import StartAuditCtaSection from './sections/StartAuditCtaSection';
import './FeaturesPage.css';

function FeaturesPage() {
  return (
    <MainLayout>
      <div className="features-page">
        <h1 className="features-page__title">서비스 소개</h1>
      </div>

      <CoreFeaturesSection />
      <FeatureShowcaseSection />
      <ImpactSection />
      <StartAuditCtaSection />
    </MainLayout>
  );
}

export default FeaturesPage;
