import { Link } from 'react-router-dom';

import { useAuthStore } from '../../../../entities/user/model/authStore';
import AuthGatedLink from '../../../../entities/user/ui/AuthGatedLink';
import {
  hasInProgressAudit,
  useAuditsPolling,
} from '../../../../features/audit/model/useAuditsPolling';

import './HeroSection.css';

function HeroSection() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.user));
  const audits = useAuditsPolling(isAuthenticated);
  // audits는 첫 폴링 응답이 오기 전까지 null이다. 이 순간을 "진행 중인 감사 없음"으로
  // 취급하면 페이지 진입 직후 잠깐 버튼이 풀렸다가 다시 막히는 것처럼 보이므로,
  // 응답을 받기 전까지는 안전하게 막아둔다(fail-closed).
  const isAuditStatusLoading = isAuthenticated && audits === null;
  const isAuditRunning = isAuthenticated && hasInProgressAudit(audits);
  const isStartBlocked = isAuditStatusLoading || isAuditRunning;

  return (
    <section className="hero-section">
      <div className="hero-section__main">
        <h1 className="hero-section__title">
          AI기본법 감사, 업로드 한 번으로 끝
        </h1>

        <p className="hero-section__subtitle">
          신용평가 모델의 설명가능성·공정성·규제준수를 자동 감사합니다
        </p>

        <div className="hero-section__actions">
          {isStartBlocked ? (
            <span
              className="hero-section__cta hero-section__cta--disabled"
              aria-disabled="true"
            >
              {isAuditRunning
                ? '감사 시작 (진행 중인 감사 완료 후 이용 가능)'
                : '감사 시작'}
            </span>
          ) : (
            <AuthGatedLink to="/pre-diagnosis" className="hero-section__cta">
              감사 시작
            </AuthGatedLink>
          )}

          <Link to="/features" className="hero-section__secondary-cta">
            기능 살펴보기
          </Link>
        </div>
      </div>

      <div className="hero-section__card">
        <p className="hero-section__card-title">대시보드 확인하기</p>
        <p className="hero-section__card-subtitle">
          지금 선제대응이 필요합니다
        </p>

        {isAuthenticated ? (
          <Link to="/dashboard" className="hero-section__card-button">
            이동 →
          </Link>
        ) : (
          <Link to="/login" className="hero-section__card-button">
            로그인 →
          </Link>
        )}

        <img
          className="hero-section__card-mascot"
          src="/mascot.png"
          alt=""
          aria-hidden="true"
        />
      </div>
    </section>
  );
}

export default HeroSection;