import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Modal, message } from 'antd';

import { useAuthStore } from '../../../entities/user/model/authStore';
import AuthGatedLink from '../../../entities/user/ui/AuthGatedLink';
import Avatar from '../../../shared/ui/Avatar';
import { maskName } from '../../../shared/lib/maskName';
import { logout } from '../../../features/auth/api/loginApi';
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

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    Modal.confirm({
      title: '로그아웃',
      content: '로그아웃 하시겠습니까?',
      okText: '확인',
      cancelText: '취소',
      centered: true,

      async onOk() {
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
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(`${item.to}/`));
          const className = isActive
            ? 'layout-header__nav-link layout-header__nav-link--active'
            : 'layout-header__nav-link';

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