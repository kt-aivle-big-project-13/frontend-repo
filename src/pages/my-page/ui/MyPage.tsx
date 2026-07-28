import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Modal, message } from 'antd';

import { useAuthStore } from '../../../entities/user/model/authStore';
import {
  fetchMyProfile,
  withdraw,
  type MyProfileResponse,
} from '../../../features/my-page/api/myPageApi';
import PasswordField from '../../../shared/ui/PasswordField';
import MainLayout from '../../../widgets/layout/ui/MainLayout';

import AccountInfoCard from './sections/AccountInfoCard';
import NotificationSettingsCard from './sections/NotificationSettingsCard';
import PasswordChangeCard from './sections/PasswordChangeCard';
import ProfileSidebar from './sections/ProfileSidebar';
import './MyPage.css';

function MyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (!user) return;

    fetchMyProfile()
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [user]);

  const openWithdrawModal = () => {
    setWithdrawPassword('');
    setWithdrawError('');
    setIsWithdrawModalOpen(true);
  };

  const closeWithdrawModal = () => {
    if (isWithdrawing) return;
    setIsWithdrawModalOpen(false);
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawPassword) {
      setWithdrawError('비밀번호를 입력해주세요.');
      return;
    }

    try {
      setIsWithdrawing(true);
      setWithdrawError('');

      await withdraw({ password: withdrawPassword });

      // 탈퇴 시 백엔드가 현재 세션(액세스 토큰 블랙리스트 + 리프레시 토큰)을
      // 이미 무효화했으므로, 프론트는 로컬에 남은 토큰만 정리하면 된다.
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('refreshToken');
      clearAuth();

      setIsWithdrawModalOpen(false);
      navigate('/');
      message.success('회원 탈퇴가 완료되었습니다.');
    } catch (error: unknown) {
      const apiMessage = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined;

      setWithdrawError(apiMessage ?? '회원 탈퇴에 실패했습니다.');
    } finally {
      setIsWithdrawing(false);
    }
  };

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
              <button
                type="button"
                className="my-page__withdraw-link"
                onClick={openWithdrawModal}
              >
                회원 탈퇴
              </button>
            </div>

            <Modal
              title="회원 탈퇴"
              open={isWithdrawModalOpen}
              onCancel={closeWithdrawModal}
              centered
              footer={[
                <button
                  key="cancel"
                  type="button"
                  className="my-page__withdraw-modal-cancel"
                  onClick={closeWithdrawModal}
                  disabled={isWithdrawing}
                >
                  취소
                </button>,
                <button
                  key="confirm"
                  type="button"
                  className="my-page__withdraw-modal-confirm"
                  onClick={handleConfirmWithdraw}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? '처리 중...' : '탈퇴하기'}
                </button>,
              ]}
            >
              <p className="my-page__withdraw-modal-warning">
                탈퇴 시 로그인이 즉시 차단되며, 되돌릴 수 없습니다. 계속하려면
                비밀번호를 입력해주세요.
              </p>

              <div className="my-page__field">
                <label htmlFor="my-page-withdraw-password">비밀번호</label>
                <PasswordField
                  id="my-page-withdraw-password"
                  value={withdrawPassword}
                  disabled={isWithdrawing}
                  ariaInvalid={!!withdrawError}
                  ariaDescribedBy={
                    withdrawError ? 'my-page-withdraw-password-error' : undefined
                  }
                  onChange={(value) => {
                    setWithdrawPassword(value);
                    setWithdrawError('');
                  }}
                />

                {withdrawError && (
                  <p
                    id="my-page-withdraw-password-error"
                    className="my-page__withdraw-modal-error"
                    role="alert"
                  >
                    {withdrawError}
                  </p>
                )}
              </div>
            </Modal>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default MyPage;