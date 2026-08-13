import { CORE_FEATURES } from '../../../../shared/config/coreFeatures';

import './CoreFeaturesSection.css';

function CoreFeaturesSection() {
  return (
    <section className="core-features-section">
      <h2 className="core-features-section__title">핵심 기능 5종</h2>

      <div className="core-features-section__intro">
        <h3 className="core-features-section__intro-title">
          다섯 가지 기능, 하나의 워크플로우
        </h3>

        <p className="core-features-section__intro-description">
          ① 사전진단으로 고영향 AI 여부를 판정하고 ② SHAP·Fairlearn 신뢰성검증 ③ 규제 체크리스트 점검
          <br />
          ④ 이의제기 대응문서 생성 ⑤ 운영
          모니터링까지 — 감사 업무 전 과정을 한 곳에서 처리합니다.
        </p>
      </div>

      <div className="core-features-section__grid">
        {CORE_FEATURES.map((feature) => (
          <div key={feature.title} className="core-features-section__card">
            <div
              className="core-features-section__card-icon"
              aria-hidden="true"
            >
              <feature.icon size={18} color="#2d67e8" stroke={2} />
            </div>

            <h4 className="core-features-section__card-title">
              {feature.title}
            </h4>
            <p className="core-features-section__card-description">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CoreFeaturesSection;
