import { Link, useLocation } from 'react-router-dom';

import { useAuthStore, type UserRole } from '../../../entities/user/model/authStore';
import { useIsAdmin } from '../../../entities/user/model/permissions';
import AuthGatedLink from '../../../entities/user/ui/AuthGatedLink';
import { maskName } from '../../../shared/lib/maskName';

import './Header.css';

const ROLE_LABEL: Record<UserRole, string> = {
  user: '사용자',
  editor: '편집자',
  admin: '관리자',
};

const NAV_ITEMS = [
  { label: '메인', to: '/', gated: false },
  { label: '감사', to: '/audit', gated: true },
  { label: '대시보드', to: '/dashboard', gated: true },
  { label: '이의제기', to: '/objections', gated: true },
  { label: '마이페이지', to: '/my-page', gated: true },
];

const ADMIN_NAV_ITEM = {
  label: '관리자 권한',
  to: '/admin',
  gated: true,
  isAdminItem: true,
};

function Header() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAdmin = useIsAdmin();

  const navItems = isAdmin ? [ADMIN_NAV_ITEM, ...NAV_ITEMS] : NAV_ITEMS;

  return (
    <header className="layout-header">
      <div className="layout-header__brand">
        <Link to="/" className="layout-header__logo">
          <span className="layout-header__logo-dot" aria-hidden="true" />
          <span>FinAuditAI</span>
        </Link>

        {user && (
          <span className="layout-header__greeting">
            {maskName(user.name)}({ROLE_LABEL[user.role]})
          </span>
        )}
      </div>

      <nav className="layout-header__nav" aria-label="메인 메뉴">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;

          const classNames = ['layout-header__nav-link'];

          if ('isAdminItem' in item && item.isAdminItem) {
            classNames.push('layout-header__nav-link--admin');
          }

          if (isActive) {
            classNames.push('layout-header__nav-link--active');
          }

          const className = classNames.join(' ');

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
