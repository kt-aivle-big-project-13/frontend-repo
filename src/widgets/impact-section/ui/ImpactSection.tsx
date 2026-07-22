import './ImpactSection.css';

const IMPACTS = [
  {
    value: '60~80%',
    description: '감사 수작업 절감 (EY·Tiger Analytics 2025)',
  },
  {
    value: '$365K',
    description: 'AI 차별 소송 배상 사례 — 선제대응 필요',
  },
  {
    value: '5년',
    description: '감사 이력 법정 보관 자동화 (시행령 27조②)',
  },
];

function ImpactSection() {
  return (
    <section className="impact-section">
      <h2 className="impact-section__title">기대효과</h2>

      <div className="impact-section__grid">
        {IMPACTS.map((impact) => (
          <div key={impact.value} className="impact-section__card">
            <p className="impact-section__value">{impact.value}</p>
            <p className="impact-section__description">
              {impact.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ImpactSection;
