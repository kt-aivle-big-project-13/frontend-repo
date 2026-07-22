import AuthGatedLink from '../../../../entities/user/ui/AuthGatedLink';

import './FeaturesSection.css';

const FEATURES = [
  {
    title: '① 고영향 AI 사전진단',
    description: '모델이 고영향 AI인지 판단 가능합니다.',
    to: '/pre-diagnosis',
  },
  {
    title: '② 신뢰성 검증·규제대응',
    description: 'AI 기본법 조항을 충족하는지 자동 감사할 수 있습니다.',
    to: '/reliability',
  },
  {
    title: '③ AI 기본법 체크리스트 제공',
    description:
      'AI 기본법 조항 관련 체크리스트를 통해 자동으로 감사할 수 있습니다.',
    to: '/checklist',
  },
  {
    title: '④ 이의제기 대응문서',
    description: '고객의 이의제기 관련 대응 의견을 초안 작성할 수 있습니다.',
    to: '/objections',
  },
  {
    title: '⑤ 운영 대시보드',
    description: '최종으로 산출된 결과물을 대시보드로 볼 수 있습니다.',
    to: '/dashboard',
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="features-section">
      <h2 className="features-section__title">핵심 기능 5종</h2>

      <div className="features-section__grid">
        {FEATURES.map((feature) => (
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
