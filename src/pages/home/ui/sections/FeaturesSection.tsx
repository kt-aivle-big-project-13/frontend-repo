import AuthGatedLink from '../../../../entities/user/ui/AuthGatedLink';
import { CORE_FEATURES } from '../../../../shared/config/coreFeatures';

import './FeaturesSection.css';

function FeaturesSection() {
  return (
    <section className="features-section">
      <h2 className="features-section__title">핵심 기능 5종</h2>

      <div className="features-section__grid">
        {CORE_FEATURES.map((feature) => (
          <AuthGatedLink
            key={feature.title}
            to={feature.to}
            className="features-section__card"
          >
            <div
              className="features-section__card-icon"
              aria-hidden="true"
            />
            <span
              className="features-section__card-arrow"
              aria-hidden="true"
            >
              →
            </span>

            <h3 className="features-section__card-title">{feature.title}</h3>
            <p className="features-section__card-description">
              {feature.description}
            </p>
          </AuthGatedLink>
        ))}
      </div>
    </section>
  );
}

export default FeaturesSection;
