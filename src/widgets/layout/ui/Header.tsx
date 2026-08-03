import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Modal, message } from 'antd';

import { useAuthStore } from '../../../entities/user/model/authStore';
import AuthGatedLink from '../../../entities/user/ui/AuthGatedLink';
import Avatar from '../../../shared/ui/Avatar';
import { maskName } from '../../../shared/lib/maskName';
import { logout } from '../../../features/auth/api/loginApi';
import { useSubmissionLockStore } from '../../../shared/model/submissionLockStore';
import {
  hasInProgressAudit,
  useAuditsPolling,
} from '../../../features/audit/model/useAuditsPolling';
import AuditStartLink from '../../../features/audit/ui/AuditStartLink';
import NotificationBell from './NotificationBell';

import './Header.css';

const NAV_ITEMS = [
  { label: '메인', to: '/', gated: false },
  { label: '감사', to: '/pre-diagnosis', gated: true },
  { label: '대시보드', to: '/dashboard', gated: true },
  { label: '이의제기', to: '/objections', gated: true },
  { label: '게시판', to: '/board', gated: true },
  { label: '마이페이지', to: '/my-page', gated: true },
];

// 이미 진행 중인 감사가 있으면 새 감사(사전진단)를 시작하는 진입점을 막는다.
// 홈 화면 히어로 CTA와 동일한 규칙을 헤더 내비게이션에도 적용한다.
const AUDIT_START_PATH = '/pre-diagnosis';

// "감사" 메뉴는 고영향 AI 확인 모달에서 "예"를 선택하면 사전진단을 건너뛰고
// /audit로 바로 이동할 수 있으므로, 그 경로들도 같은 메뉴의 활성 상태로 표시한다.
const isAuditRoute = (pathname: string) =>
  pathname === '/audit' || pathname.startsWith('/audit/');

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isSubmissionLocked = useSubmissionLockStore((state) => state.isLocked);
  const isAuthenticated = Boolean(user);
  const audits = useAuditsPolling(isAuthenticated);
  const isAuditRunning = isAuthenticated && hasInProgressAudit(audits);

  const handleLogout = () => {
    // 모델 업로드~감사 시작처럼 여러 단계 요청이 진행 중일 때 로그아웃하면 토큰이
    // 무효화되어 뒤 단계 요청이 401로 실패하고, 앞 단계만 반영된 채 남을 수 있다.
    if (isSubmissionLocked) {
      message.warning('제출이 진행 중입니다. 완료된 후 다시 시도해주세요.');
      return;
    }

    Modal.confirm({
      title: '로그아웃',
      content: '로그아웃 하시겠습니까?',
      okText: '확인',
      cancelText: '취소',
      centered: true,

      async onOk() {
        // 모달이 열려있는 동안(사용자가 "확인"을 누르기 전) 다른 화면에서 제출이 시작될
        // 수 있다. onOk는 모달을 연 시점에 클로저로 캡처한 isSubmissionLocked를 그대로
        // 쓰므로, 실행 시점의 최신 잠금 상태를 스토어에서 다시 읽어와야 한다.
        if (useSubmissionLockStore.getState().isLocked) {
          message.warning('제출이 진행 중입니다. 완료된 후 다시 시도해주세요.');
          return;
        }

        try {
          await logout();

          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem('refreshToken');
          clearAuth();
          navigate('/');

          message.success('로그아웃되었습니다.');
        } catch {
          message.error('로그아웃에 실패했습니다.');
        }
      },
    });
  };

  return (
    <header className="layout-header">
      <div className="layout-header__brand">
        <Link to="/" className="layout-header__logo">
          <span className="layout-header__logo-dot" aria-hidden="true" />
          <span>FinAuditAI</span>
        </Link>

        {user && (
          <div className="layout-header__user">
            <Avatar size={28} />
            <span className="layout-header__greeting">
              {maskName(user.name)} 고객님
            </span>
            <button
              type="button"
              className="layout-header__logout"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>

      <nav className="layout-header__nav" aria-label="메인 메뉴">
        {NAV_ITEMS.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(`${item.to}/`)) ||
            (item.to === AUDIT_START_PATH && isAuditRoute(location.pathname));
          const className = isActive
            ? 'layout-header__nav-link layout-header__nav-link--active'
            : 'layout-header__nav-link';

          if (item.to === AUDIT_START_PATH) {
            if (isAuditRunning) {
              return (
                <span
                  key={item.to}
                  className={`${className} layout-header__nav-link--disabled`}
                  aria-disabled="true"
                  title="진행 중인 감사가 완료된 후 이용할 수 있습니다"
                >
                  {item.label}
                </span>
              );
            }

            return (
              <AuditStartLink key={item.to} className={className}>
                {item.label}
              </AuditStartLink>
            );
          }

          if (item.gated) {
            return (
              <AuthGatedLink key={item.to} to={item.to} className={className}>
                {item.label}
              </AuthGatedLink>
            );
          }

          return (
            <Link key={item.to} to={item.to} className={className}>
              {item.label}
            </Link>
          );
        })}

        {user && <NotificationBell />}
      </nav>
    </header>
  );
}

export default Header;