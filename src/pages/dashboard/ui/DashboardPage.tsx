import { useQuery } from '@tanstack/react-query';

import { getDashboard } from '../../../features/dashboard/api/dashboardApi';
import MainLayout from '../../../widgets/layout/ui/MainLayout';

import DashboardOverviewSection from './sections/DashboardOverviewSection';
import DashboardSummarySection from './sections/DashboardSummarySection';
import FairnessDistributionSection from './sections/FairnessDistributionSection';
import RecentAuditsSection from './sections/RecentAuditsSection';
import './DashboardPage.css';

function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });

  return (
    <MainLayout>
      <div className="dashboard-page">
        <div className="dashboard-page__inner">
          <header className="dashboard-page__header">
            <h1 className="dashboard-page__title">AI 운영 모니터링 대시보드</h1>
            <p className="dashboard-page__description">
              전체 모델의 규제 준수 상태와 주요 위험을 한눈에 확인합니다.
            </p>
          </header>

          {dashboardQuery.isPending && (
            <div className="dashboard-page__state" role="status">
              대시보드 데이터를 불러오는 중입니다.
            </div>
          )}

          {dashboardQuery.isError && (
            <div className="dashboard-page__state" role="alert">
              <p>대시보드 데이터를 불러오지 못했습니다.</p>
              <button
                type="button"
                className="dashboard-page__retry-button"
                onClick={() => dashboardQuery.refetch()}
              >
                다시 불러오기
              </button>
            </div>
          )}

          {dashboardQuery.isSuccess && (
            <div className="dashboard-page__content">
              <DashboardSummarySection summary={dashboardQuery.data.summary} />
              <DashboardOverviewSection
                distribution={dashboardQuery.data.auditResultDistribution}
                models={dashboardQuery.data.reviewRequiredTopModels}
              />
              <FairnessDistributionSection
                metrics={dashboardQuery.data.fairnessMetricDistributions}
              />
              <RecentAuditsSection audits={dashboardQuery.data.recentAudits} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default DashboardPage;
