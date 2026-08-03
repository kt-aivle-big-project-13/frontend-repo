import { Tooltip } from 'antd';

import type { FeatureImportanceItem } from '../../../../features/audit/api/auditApi';
import './TopFeaturesCard.css';

interface TopFeaturesCardProps {
  features: FeatureImportanceItem[];
  isLoading: boolean;
  error: string | null;
}

function TopFeaturesCard({ features, isLoading, error }: TopFeaturesCardProps) {
  const maxValue = Math.max(...features.map((item) => item.value ?? 0), 0.0001);

  return (
    <section className="top-features-card">
      <h2 className="top-features-card__title">예측 영향 변수 TOP 5</h2>

      {isLoading ? (
        <p className="top-features-card__status">불러오는 중…</p>
      ) : error ? (
        <p className="top-features-card__status top-features-card__status--error">{error}</p>
      ) : features.length === 0 ? (
        <p className="top-features-card__status">피처 중요도 결과가 없습니다.</p>
      ) : (
        <ul className="top-features-card__list">
          {features.map((item) => (
            <li key={item.feature} className="top-features-card__row">
              <Tooltip title={item.feature}>
                <span className="top-features-card__name">{item.feature}</span>
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
          ))}
        </ul>
      )}
    </section>
  );
}

export default TopFeaturesCard;