import { useEffect, useState } from 'react';

import { useAuthStore } from '../../../entities/user/model/authStore';
import { fetchMyProfile, type MyProfileResponse } from '../../../features/my-page/api/myPageApi';
import MainLayout from '../../../widgets/layout/ui/MainLayout';

import AccountInfoCard from './sections/AccountInfoCard';
import NotificationSettingsCard from './sections/NotificationSettingsCard';
import PasswordChangeCard from './sections/PasswordChangeCard';
import ProfileSidebar from './sections/ProfileSidebar';
import './MyPage.css';

function MyPage() {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);

  useEffect(() => {
    if (!user) return;

    fetchMyProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [user]);

  return (
    <MainLayout>
      <div className="my-page">
        {!user ? (
          <p className="my-page__denied" role="alert">
            로그인이 필요합니다.
          </p>
        ) : (
          <>
            <header className="my-page__header">
              <h1 className="my-page__title">마이페이지</h1>
              <p className="my-page__subtitle">계정 정보와 알림 설정을 관리하세요</p>
            </header>

            <div className="my-page__layout">
              <ProfileSidebar user={user} profile={profile} />

              <div className="my-page__main">
                <AccountInfoCard user={user} />
                <PasswordChangeCard />
                <NotificationSettingsCard />
              </div>
            </div>

            <div className="my-page__withdraw">
              <span>더 이상 서비스를 이용하지 않으신다면</span>
              <button type="button" className="my-page__withdraw-link">
                회원 탈퇴
              </button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default MyPage;