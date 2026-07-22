import AuthGatedLink from '../../../../entities/user/ui/AuthGatedLink';

import './StartAuditCtaSection.css';

function StartAuditCtaSection() {
  return (
    <section className="start-audit-cta-section">
      <h2 className="start-audit-cta-section__title">
        지금 첫 감사를 시작해보세요
      </h2>

      <p className="start-audit-cta-section__subtitle">
        모델 파일 업로드 한 번이면 충분합니다
      </p>

      <AuthGatedLink to="/audit" className="start-audit-cta-section__button">
        감사 시작 →
      </AuthGatedLink>
    </section>
  );
}

export default StartAuditCtaSection;
