import { Tooltip } from 'antd';

import type { FeatureImportanceItem } from '../../../../features/audit/api/auditApi';
import { getFeatureLabel } from './featureData';
import './TopFeaturesCard.css';

interface TopFeaturesCardProps {
  features: FeatureImportanceItem[];
  isLoading: boolean;
  error: string | null;
}

// 카드가 약속하는 개수. API(`/audits/{id}/explainability`)는 저장된 순위를 전부 돌려주므로
// 여기서 잘라야 제목과 목록이 어긋나지 않는다.
const TOP_FEATURE_COUNT = 5;

function TopFeaturesCard({ features, isLoading, error }: TopFeaturesCardProps) {
  const topFeatures = [...features]
    .sort((first, second) => first.rank - second.rank)
    .slice(0, TOP_FEATURE_COUNT);

  const maxValue = Math.max(...topFeatures.map((item) => item.value ?? 0), 0.0001);

  return (
    <section className="top-features-card">
      <h2 className="top-features-card__title">예측 영향 변수 TOP 5</h2>

      {isLoading ? (
        <p className="top-features-card__status">불러오는 중…</p>
      ) : error ? (
        <p className="top-features-card__status top-features-card__status--error">{error}</p>
      ) : topFeatures.length === 0 ? (
        <p className="top-features-card__status">피처 중요도 결과가 없습니다.</p>
      ) : (
        <ul className="top-features-card__list">
          {topFeatures.map((item) => {
            const koreanLabel = getFeatureLabel(item.feature);

            return (
              <li key={item.feature} className="top-features-card__row">
                <Tooltip title={koreanLabel ? `${koreanLabel} (${item.feature})` : item.feature}>
                  <span className="top-features-card__name">{koreanLabel ?? item.feature}</span>
                </Tooltip>

                <div className="top-features-card__bar-track">
                  <div
                    className="top-features-card__bar-fill"
                    style={{ width: `${((item.value ?? 0) / maxValue) * 100}%` }}
                  />
                </div>

                <span className="top-features-card__value">
                  {item.value != null ? item.value.toFixed(3) : '—'}
                </span>

                <span
                  className={`top-features-card__tag${item.isSensitive ? '' : ' top-features-card__tag--hidden'}`}
                >
                  민감변수
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default TopFeaturesCard;