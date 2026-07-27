import './VersionHistorySection.css';

interface VersionRecord {
  version: string;
  date: string;
  summary: string;
  isCurrent: boolean;
}

// TODO: 실제 버전 이력 조회 API 연동 필요
const VERSION_HISTORY: VersionRecord[] = [];

function VersionHistorySection() {
  return (
    <section className="version-history-section">
      <h2 className="version-history-section__title">버전 이력</h2>

      {VERSION_HISTORY.length === 0 ? (
        <p className="version-history-section__empty">
          아직 버전 이력이 없습니다.
        </p>
      ) : (
        <ul className="version-history-section__list">
          {VERSION_HISTORY.map((record) => (
            <li
              key={record.version}
              className={`version-history-section__row${
                record.isCurrent
                  ? ' version-history-section__row--current'
                  : ''
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
                <button
                  type="button"
                  className="version-history-section__link"
                >
                  비교 보기
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default VersionHistorySection;
