import MainLayout from '../../../widgets/layout/ui/MainLayout';

import AuditOverviewSection from './sections/AuditOverviewSection';
import FeaturesSection from './sections/FeaturesSection';
import HeroSection from './sections/HeroSection';
import ImpactSection from './sections/ImpactSection';

function HomePage() {
  return (
    <MainLayout>
      <HeroSection />
      <FeaturesSection />
      <AuditOverviewSection />
      <ImpactSection />
    </MainLayout>
  );
}

export default HomePage;
