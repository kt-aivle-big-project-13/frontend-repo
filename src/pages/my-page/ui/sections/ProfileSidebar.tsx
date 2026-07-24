import type { User } from '../../../../entities/user/model/authStore';
import type { MyProfileResponse } from '../../../../features/my-page/api/myPageApi';
import { maskEmail } from '../../../../shared/lib/maskEmail';
import { maskName } from '../../../../shared/lib/maskName';
import Avatar from '../../../../shared/ui/Avatar';

const PROFILE_META_PLACEHOLDER = '—';

interface ProfileSidebarProps {
  user: User;
  profile: MyProfileResponse | null;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return PROFILE_META_PLACEHOLDER;

  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ProfileSidebar({ user, profile }: ProfileSidebarProps) {
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
            {profile?.institution ?? PROFILE_META_PLACEHOLDER}
          </span>
        </div>
        <div className="my-page__sidebar-meta-row">
          <span className="my-page__sidebar-meta-label">가입일</span>
          <span className="my-page__sidebar-meta-value">
            {formatDateTime(profile?.createdAt)}
          </span>
        </div>
        <div className="my-page__sidebar-meta-row">
          <span className="my-page__sidebar-meta-label">최근 로그인</span>
          <span className="my-page__sidebar-meta-value">
            {formatDateTime(profile?.lastLoginAt)}
          </span>
        </div>
      </div>
    </aside>
  );
}

export default ProfileSidebar;