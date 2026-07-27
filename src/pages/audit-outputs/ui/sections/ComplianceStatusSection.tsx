import './ComplianceStatusSection.css';

type ComplianceStatus = '충족' | '미충족';

interface ComplianceItem {
  id: string;
  label: string;
  status: ComplianceStatus;
}

// TODO: 실제 규제준수 판정 API 연동 필요 — 현재는 목업 값
const COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    id: 'risk-management',
    label: '위험관리방안 (34조①1호, 보관+게시)',
    status: '충족',
  },
  {
    id: 'user-protection',
    label: '이용자보호방안 (34조①3호, 보관+게시)',
    status: '충족',
  },
  {
    id: 'oversight',
    label: '관리·감독체계 (34조①4호)',
    status: '충족',
  },
  {
    id: 'summary',
    label: '게시용 요약본 (시행령27조①)',
    status: '미충족',
  },
  {
    id: 'master-report',
    label: '종합 감사 보고서 (마스터)',
    status: '미충족',
  },
];

function ComplianceStatusSection() {
  return (
    <section className="compliance-status-section">
      <h2 className="compliance-status-section__title">충족/미충족 여부</h2>

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
    </section>
  );
}

export default ComplianceStatusSection;
