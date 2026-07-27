import './VersionHistorySection.css';

interface VersionRecord {
  version: string;
  date: string;
  summary: string;
  isCurrent: boolean;
}

// TODO: 실제 버전 이력 조회 API 연동 필요 — 현재는 목업 값
const VERSION_HISTORY: VersionRecord[] = [
  { version: 'v2', date: '2026.07.06', summary: '현재 · 준수', isCurrent: true },
  {
    version: 'v1',
    date: '2026.06.28',
    summary: '미충족 → 개선 후 재감사',
    isCurrent: false,
  },
];

function VersionHistorySection() {
  return (
    <section className="version-history-section">
      <h2 className="version-history-section__title">버전 이력</h2>

      <ul className="version-history-section__list">
        {VERSION_HISTORY.map((record) => (
          <li
            key={record.version}
            className={`version-history-section__row${
              record.isCurrent ? ' version-history-section__row--current' : ''
            }`}
          >
            <span
              className={`version-history-section__version${
                record.isCurrent
                  ? ' version-history-section__version--current'
                  : ''
              }`}
            >
              {record.version}
            </span>
            <span className="version-history-section__date">
              {record.date}
            </span>
            <span className="version-history-section__summary">
              {record.summary}
            </span>
            {!record.isCurrent && (
              <button type="button" className="version-history-section__link">
                비교 보기
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default VersionHistorySection;
