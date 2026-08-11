import ImpactSection from '../../../widgets/impact-section/ui/ImpactSection';
import MainLayout from '../../../widgets/layout/ui/MainLayout';

import AuditOverviewSection from './sections/AuditOverviewSection';
import FeaturesSection from './sections/FeaturesSection';
import HeroSection from './sections/HeroSection';

function HomePage() {
  return (
    <MainLayout>
      <HeroSection />
      <AuditOverviewSection />
      <FeaturesSection />
      <ImpactSection />
    </MainLayout>
  );
}

export default HomePage;
