import { useState } from 'react';

import PolicyModal from '../../../shared/ui/policy-modal/PolicyModal';

import './Footer.css';

function Footer() {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  return (
    <footer className="layout-footer">
      <div className="layout-footer__inner">
        <p className="layout-footer__brand-line">
          FinAuditAI
          <button
            type="button"
            className="layout-footer__privacy-link"
            onClick={() => setIsPrivacyOpen(true)}
          >
            개인정보 처리방침
          </button>
        </p>

        <p className="layout-footer__info">
          (주)케이티 경기도 성남시 분당구 불정로 90 (정자동)
          <span className="layout-footer__divider" aria-hidden="true">
            |
          </span>
          대표자명: 머지해조
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

      {isPrivacyOpen && (
        <PolicyModal type="privacy" onClose={() => setIsPrivacyOpen(false)} />
      )}
    </footer>
  );
}

export default Footer;
