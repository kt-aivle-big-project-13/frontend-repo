import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../../entities/user/model/authStore';
import AuthGatedLink from '../../../entities/user/ui/AuthGatedLink';
import { maskName } from '../../../shared/lib/maskName';

import './Header.css';

const NAV_ITEMS = [
  { label: '메인', to: '/', gated: false },
  { label: '감사', to: '/audit', gated: true },
  { label: '대시보드', to: '/dashboard', gated: true },
  { label: '이의제기', to: '/objections', gated: true },
  { label: '마이페이지', to: '/my-page', gated: true },
];

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('refreshToken');
    clearAuth();
    navigate('/');
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
          const isActive = location.pathname === item.to;
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
      </nav>
    </header>
  );
}

export default Header;
