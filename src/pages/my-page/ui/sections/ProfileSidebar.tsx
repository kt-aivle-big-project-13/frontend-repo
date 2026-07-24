import type { User } from '../../../../entities/user/model/authStore';
import { maskEmail } from '../../../../shared/lib/maskEmail';
import { maskName } from '../../../../shared/lib/maskName';
import Avatar from '../../../../shared/ui/Avatar';

// TODO: 실제 "내 정보 조회" API 연동 필요 — 그 전까지는 값 없음으로 표시
const PROFILE_META_PLACEHOLDER = '—';

interface ProfileSidebarProps {
  user: User;
}

function ProfileSidebar({ user }: ProfileSidebarProps) {
  return (
    <aside className="my-page__sidebar">
      <div className="my-page__sidebar-profile">
        <Avatar size={96} />
        <p className="my-page__sidebar-name">{maskName(user.name)}</p>
        <p className="my-page__sidebar-email">{maskEmail(user.email)}</p>
      </div>

      <div className="my-page__sidebar-meta">
        <div className="my-page__sidebar-meta-row">
          <span className="my-page__sidebar-meta-label">소속기관</span>
          <span className="my-page__sidebar-meta-value">
            {PROFILE_META_PLACEHOLDER}
          </span>
        </div>
        <div className="my-page__sidebar-meta-row">
          <span className="my-page__sidebar-meta-label">가입일</span>
          <span className="my-page__sidebar-meta-value">
            {PROFILE_META_PLACEHOLDER}
          </span>
        </div>
        <div className="my-page__sidebar-meta-row">
          <span className="my-page__sidebar-meta-label">최근 로그인</span>
          <span className="my-page__sidebar-meta-value">
            {PROFILE_META_PLACEHOLDER}
          </span>
        </div>
      </div>
    </aside>
  );
}

export default ProfileSidebar;
