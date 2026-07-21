import type { ReactNode } from 'react';

import './AuthLayout.css';

interface AuthLayoutProps {
  children: ReactNode;
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      <main className="auth-layout__main">
        {/* 왼쪽 공통 브랜드 영역 */}
        <section className="auth-layout__brand">
          <div className="auth-layout__logo-area">
            <img
              className="auth-layout__logo"
              src="/finaudit-logo.png"
              alt="FinAuditAI"
            />
          </div>

          <div className="auth-layout__brand-text">
            <h1>
              신용평가 AI
              <br />
              규제준수 자동감사 플랫폼
            </h1>

            <p>AI기본법 감사 자동화로 수작업 60~80% 절감</p>
          </div>
        </section>

        {/* 오른쪽 페이지별 폼 영역 */}
        <section className="auth-layout__content">
          <div className="auth-layout__content-inner">
            {children}
          </div>
        </section>
      </main>

      {/* 하단 공통 Footer */}
      <footer className="auth-layout__footer">
        <div className="auth-layout__footer-logo">
          <span
            className="auth-layout__footer-dot"
            aria-hidden="true"
          />
          <span>FinAuditAI</span>
        </div>

        <nav
          className="auth-layout__footer-links"
          aria-label="인증 페이지 하단 메뉴"
        >
          <a href="/privacy">개인정보처리방침</a>

          <span aria-hidden="true">|</span>

          <a href="/terms">이용약관</a>

          <span aria-hidden="true">|</span>

          <span>Contact: finauditai@aivle13.com</span>
        </nav>
      </footer>
    </div>
  );
}

export default AuthLayout;