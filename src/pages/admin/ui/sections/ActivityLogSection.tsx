import { useState } from 'react';

import type { RoleMember } from './RoleBoardSection';
import './ActivityLogSection.css';

type ActivityBadgeVariant = 'promote' | 'block' | 'create';

interface ActivityLogEntry {
  actor: string;
  badgeLabel: string;
  badgeVariant: ActivityBadgeVariant;
  action: string;
  timestamp: string;
  subjectEmail: string;
}

// TODO: 실제 활동 로그(ADMIN_ACTION_LOGS) API 연동 전까지는 빈 배열이 기본값
const ACTIVITY_LOG: ActivityLogEntry[] = [];

const PAGE_SIZE = 5;

const BADGE_CLASS_NAME: Record<ActivityBadgeVariant, string> = {
  promote: 'activity-log-section__badge--promote',
  block: 'activity-log-section__badge--block',
  create: 'activity-log-section__badge--create',
};

interface ActivityLogSectionProps {
  selectedMember: RoleMember | null;
  onBack: () => void;
}

function ActivityLogSection({
  selectedMember,
  onBack,
}: ActivityLogSectionProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredLog = selectedMember
    ? ACTIVITY_LOG.filter(
        (entry) => entry.subjectEmail === selectedMember.email,
      )
    : ACTIVITY_LOG;

  const visibleLog = filteredLog.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLog.length;

  return (
    <section className="activity-log-section">
      <div className="activity-log-section__header">
        <h2 className="activity-log-section__title">
          {selectedMember ? `${selectedMember.name} 활동 로그` : '활동 로그'}
        </h2>

        {selectedMember && (
          <button
            type="button"
            className="activity-log-section__back"
            onClick={onBack}
          >
            ← 전체 로그
          </button>
        )}
      </div>

      {visibleLog.length === 0 ? (
        <p className="activity-log-section__empty">
          {selectedMember
            ? `${selectedMember.name}의 활동 로그가 없습니다.`
            : '아직 활동 로그가 없습니다.'}
        </p>
      ) : (
        <div className="activity-log-section__table-wrap">
          <table className="activity-log-section__table">
            <thead>
              <tr>
                <th>사용자</th>
                <th>변경 권한</th>
                <th>액션</th>
                <th>일시</th>
              </tr>
            </thead>
            <tbody>
              {visibleLog.map((entry) => (
                <tr key={`${entry.subjectEmail}-${entry.timestamp}`}>
                  <td>{entry.actor}</td>
                  <td>
                    <span
                      className={`activity-log-section__badge ${BADGE_CLASS_NAME[entry.badgeVariant]}`}
                    >
                      {entry.badgeLabel}
                    </span>
                  </td>
                  <td>{entry.action}</td>
                  <td>{entry.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          className="activity-log-section__load-more"
          onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
        >
          더보기
        </button>
      )}
    </section>
  );
}

export default ActivityLogSection;
