import './ComplianceStatusSection.css';

type ComplianceStatus = '충족' | '미충족';

interface ComplianceItem {
  id: string;
  label: string;
  status: ComplianceStatus;
}

// TODO: 실제 규제준수 판정 API 연동 필요
const COMPLIANCE_ITEMS: ComplianceItem[] = [];

function ComplianceStatusSection() {
  return (
    <section className="compliance-status-section">
      <h2 className="compliance-status-section__title">충족/미충족 여부</h2>

      {COMPLIANCE_ITEMS.length === 0 ? (
        <p className="compliance-status-section__empty">
          아직 판정 결과가 없습니다.
        </p>
      ) : (
        <ul className="compliance-status-section__list">
          {COMPLIANCE_ITEMS.map((item) => (
            <li key={item.id} className="compliance-status-section__row">
              <span className="compliance-status-section__label">
                {item.label}
              </span>
              <span
                className={`compliance-status-section__badge compliance-status-section__badge--${
                  item.status === '충족' ? 'pass' : 'fail'
                }`}
              >
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default ComplianceStatusSection;
