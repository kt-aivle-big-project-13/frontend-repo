import './Footer.css';

function Footer() {
  return (
    <footer className="layout-footer">
      <div className="layout-footer__inner">
        <p className="layout-footer__brand-line">
          FinAuditAI
          <a href="/privacy" className="layout-footer__privacy-link">
            개인정보 처리방침
          </a>
        </p>

        <p className="layout-footer__info">
          (주)케이티 경기도 성남시 분당구 불정로 90 (정자동)
          <span className="layout-footer__divider" aria-hidden="true">
            |
          </span>
          대표자명: 에이블러
          <span className="layout-footer__divider" aria-hidden="true">
            |
          </span>
          사업자등록번호: 031-1234-5678
          <span className="layout-footer__divider" aria-hidden="true">
            |
          </span>
          Contact : ktaivle13@kt.com
        </p>

        <p className="layout-footer__copyright">
          Copyright© 2026 FinAuditAI Corp. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
