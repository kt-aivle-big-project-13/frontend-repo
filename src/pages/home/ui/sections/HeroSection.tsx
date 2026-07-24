import { Link } from 'react-router-dom';

import { useAuthStore } from '../../../../entities/user/model/authStore';
import AuthGatedLink from '../../../../entities/user/ui/AuthGatedLink';

import './HeroSection.css';

function HeroSection() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.user));

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
          <AuthGatedLink to="/pre-diagnosis" className="hero-section__cta">
            감사 시작
          </AuthGatedLink>

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

        <AuthGatedLink to="/dashboard" className="hero-section__card-button">
          {isAuthenticated ? '이동 →' : '로그인 →'}
        </AuthGatedLink>

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
