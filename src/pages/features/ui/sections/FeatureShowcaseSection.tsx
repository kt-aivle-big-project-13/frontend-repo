import './FeatureShowcaseSection.css';

const SHOWCASE_FEATURES = [
  {
    id: 'feature-01',
    label: 'FEATURE 01',
    title: '고영향 AI 사전진단',
    description:
      '정성 게이트 2문항과 정량 배점(9점 만점)으로 모델이 고영향 AI인지 판정합니다. 4점 이상이면 고영향 AI로 판정되며, 자가검토 결과서를 PDF로 저장할 수 있습니다.',
    articleTag: '관련 조항 · AI기본법 제33조',
    image: '/features/feature-01-pre-diagnosis.png',
  },
  {
    id: 'feature-02',
    label: 'FEATURE 02',
    title: 'AI 신뢰성 검증·규제대응',
    description:
      'SHAP 설명가능성 3지표와 Fairlearn 공정성 3지표를 자동 산출하고, RAG가 실제 법조문 원문을 찾아 매칭합니다. 편향 결과는 확정 판정이 아닌 \'추가검토 신호\'로 표시됩니다.',
    articleTag: '관련 조항 · 제31조·제34조',
    image: '/features/feature-02-reliability.png',
  },
  {
    id: 'feature-03',
    label: 'FEATURE 03',
    title: '산출물(보고서) 자동 생성',
    description:
      '설명가능성 리포트(SHAP), 편향 진단 보고서(Fairlearn), 규제준수 판정서 등 보고서 5종이 PDF·Word로 자동 생성되고, 위험관리방안·이용자보호방안 등 법적 요건별 충족 여부도 한눈에 확인할 수 있습니다.',
    articleTag: '관련 조항 · 시행령 제27조②',
    image: '/features/feature-03-report.png',
  },
  {
    id: 'feature-04',
    label: 'FEATURE 04',
    title: '이의제기 대응문서 생성',
    description:
      'SHAP 판단 근거(If-Then)를 바탕으로 고객 안내문 초안을 LLM이 자동 생성합니다. 담당자 검토·승인을 거쳐 SMS·이메일로 발송되고, 모든 발송 이력이 저장됩니다.',
    articleTag: '관련 조항 · 신용정보법 제36조의2',
    image: '/features/feature-04-objection.png',
  },
  {
    id: 'feature-05',
    label: 'FEATURE 05',
    title: 'AI 운영 모니터링 대시보드',
    description:
      '법령 개정을 자동 감지해 SMS로 알리고 재감사를 권고합니다. 준수/주의/미충족/미확인 현황과 전체 감사 이력을 한눈에 관리합니다.',
    articleTag: '관련 조항 · 시행령 제27조②',
    image: '/features/feature-05-dashboard.png',
  },
];

function FeatureShowcaseSection() {
  return (
    <section className="feature-showcase-section">
      <h2 className="feature-showcase-section__title">
        화면으로 보는 주요 기능
      </h2>

      <div className="feature-showcase-section__list">
        {SHOWCASE_FEATURES.map((feature, index) => (
          <div
            key={feature.label}
            id={feature.id}
            className={
              index % 2 === 1
                ? 'feature-showcase-section__row feature-showcase-section__row--reverse'
                : 'feature-showcase-section__row'
            }
          >
            <img
              className="feature-showcase-section__image"
              src={feature.image}
              alt={feature.title}
            />

            <div className="feature-showcase-section__text">
              <span className="feature-showcase-section__label">
                {feature.label}
              </span>

              <h3 className="feature-showcase-section__row-title">
                {feature.title}
              </h3>

              <p className="feature-showcase-section__description">
                {feature.description}
              </p>

              <span className="feature-showcase-section__tag">
                {feature.articleTag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeatureShowcaseSection;