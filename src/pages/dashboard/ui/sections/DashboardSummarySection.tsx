import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

import type { DashboardSummary } from '../../../../features/dashboard/api/dashboardApi';

import './DashboardSummarySection.css';

interface DashboardSummarySectionProps {
  summary: DashboardSummary;
}

interface SummaryCard {
  label: string;
  value: string;
  icon: ReactNode;
  tone: 'default' | 'normal' | 'review' | 'exceeded' | 'compliance';
}

function DashboardSummarySection({ summary }: DashboardSummarySectionProps) {
  const cards: SummaryCard[] = [
    {
      label: '전체 모델',
      value: String(summary.analyzedModelCount),
      icon: <AppstoreOutlined />,
      tone: 'default',
    },
    {
      label: '충족',
      value: String(summary.normalModelCount),
      icon: <CheckCircleOutlined />,
      tone: 'normal',
    },
    {
      label: '주의',
      value: String(summary.reviewRequiredCount),
      icon: <WarningOutlined />,
      tone: 'review',
    },
    {
      label: '추가 검토',
      value: String(summary.thresholdExceededCount),
      icon: <ExclamationCircleOutlined />,
      tone: 'exceeded',
    },
    {
      label: '전체 규정 준수율',
      value: `${summary.complianceRate.toFixed(1)}%`,
      icon: <SafetyCertificateOutlined />,
      tone: 'compliance',
    },
  ];

  return (
    <section className="dashboard-summary" aria-label="대시보드 주요 지표">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`dashboard-summary__card dashboard-summary__card--${card.tone}`}
        >
          <div className="dashboard-summary__label">
            <span className="dashboard-summary__icon" aria-hidden="true">
              {card.icon}
            </span>
            <span>{card.label}</span>
          </div>
          <strong className="dashboard-summary__value">{card.value}</strong>
        </article>
      ))}
    </section>
  );
}

export default DashboardSummarySection;
