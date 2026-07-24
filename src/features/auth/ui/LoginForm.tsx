import {
  type ChangeEvent,
  type FormEvent,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';

import { useAuthStore } from '../../../entities/user/model/authStore';
import '../../../shared/ui/authForm.css';
import { login } from '../api/loginApi';

import './LoginForm.css';

interface LoginFormState {
  email: string;
  password: string;
}

interface LoginErrors {
  email: string;
  password: string;
  recaptcha: string;
  submit: string;
}

const INITIAL_FORM: LoginFormState = {
  email: '',
  password: '',
};

const INITIAL_ERRORS: LoginErrors = {
  email: '',
  password: '',
  recaptcha: '',
  submit: '',
};

function LoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const recaptchaSiteKey =
    import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  if (!recaptchaSiteKey) {
    throw new Error(
      'VITE_RECAPTCHA_SITE_KEY가 설정되지 않았습니다.',
    );
  }

  const [form, setForm] =
    useState<LoginFormState>(INITIAL_FORM);

  const [errors, setErrors] =
    useState<LoginErrors>(INITIAL_ERRORS);

  const [recaptchaToken, setRecaptchaToken] =
    useState<string | null>(null);

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [
    isRememberMeChecked,
    setIsRememberMeChecked,
  ] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(false);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const fieldName =
      event.target.name as keyof LoginFormState;

    const { value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [fieldName]: value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [fieldName]: '',
      submit: '',
    }));

    setSuccessMessage('');
  };

  const validateForm = (): boolean => {
    const nextErrors: LoginErrors = {
      email: '',
      password: '',
      recaptcha: '',
      submit: '',
    };

    const trimmedEmail = form.email.trim();

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedEmail) {
      nextErrors.email =
        '이메일을 입력해주세요.';
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email =
        '올바른 이메일 형식을 입력해주세요.';
    }

    if (!form.password) {
      nextErrors.password =
        '비밀번호를 입력해주세요.';
    }

    if (!recaptchaToken) {
      nextErrors.recaptcha =
        '로봇이 아님을 확인해주세요.';
    }

    setErrors(nextErrors);

    return (
      !nextErrors.email &&
      !nextErrors.password &&
      !nextErrors.recaptcha
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!recaptchaToken) {
      return;
    }

    try {
      setIsLoading(true);
      setSuccessMessage('');

      setErrors((previousErrors) => ({
        ...previousErrors,
        submit: '',
      }));

      const response = await login({
        email: form.email.trim(),
        password: form.password,
        rememberMe: isRememberMeChecked,
        recaptchaToken,
      });

      const user = {
        id: response.userId,
        email: response.email,
        name: response.name,
      };

      setAuth(response.accessToken, user);

      if (isRememberMeChecked) {
        localStorage.setItem(
          'refreshToken',
          response.refreshToken,
        );

        sessionStorage.removeItem(
          'refreshToken',
        );
      } else {
        sessionStorage.setItem(
          'refreshToken',
          response.refreshToken,
        );

        localStorage.removeItem(
          'refreshToken',
        );
      }

      setSuccessMessage('로그인되었습니다.');

      navigate('/', {
        replace: true,
      });
    } catch (error: unknown) {
      // 로그인 실패 시 상세 오류는 화면에 노출하지 않음
      console.error('로그인 실패:', error);

      setRecaptchaToken(null);
      recaptchaRef.current?.reset();

      setErrors((previousErrors) => ({
        ...previousErrors,
        submit:
          '이메일 또는 비밀번호를 확인해주세요.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <header className="auth-form__header">
        <h2>로그인</h2>
      </header>

      <form
        className="auth-form__body"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="auth-form__field">
          <label htmlFor="login-email">
            이메일
          </label>

          <input
            id="login-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            disabled={isLoading}
            aria-invalid={Boolean(
              errors.email,
            )}
            aria-describedby={
              errors.email
                ? 'login-email-error'
                : undefined
            }
          />

          {errors.email && (
            <p
              id="login-email-error"
              className="auth-form__field-error"
            >
              {errors.email}
            </p>
          )}
        </div>

        <div className="auth-form__field">
          <label htmlFor="login-password">
            비밀번호
          </label>

          <input
            id="login-password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            disabled={isLoading}
            aria-invalid={Boolean(
              errors.password ||
                errors.submit,
            )}
            aria-describedby={
              errors.password
                ? 'login-password-error'
                : errors.submit
                  ? 'login-submit-error'
                  : undefined
            }
          />

          {errors.password && (
            <p
              id="login-password-error"
              className="auth-form__field-error"
            >
              {errors.password}
            </p>
          )}

          {errors.submit && (
            <p
              id="login-submit-error"
              className="auth-form__field-error"
              role="alert"
            >
              {errors.submit}
            </p>
          )}
        </div>

        <div className="login-form__recaptcha">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={recaptchaSiteKey}
            hl="ko"
            onChange={(token) => {
              setRecaptchaToken(token);

              setErrors(
                (previousErrors) => ({
                  ...previousErrors,
                  recaptcha: '',
                }),
              );
            }}
            onExpired={() => {
              setRecaptchaToken(null);

              setErrors(
                (previousErrors) => ({
                  ...previousErrors,
                  recaptcha:
                    '로봇 인증이 만료되었습니다. 다시 확인해주세요.',
                }),
              );
            }}
            onErrored={() => {
              setRecaptchaToken(null);

              setErrors(
                (previousErrors) => ({
                  ...previousErrors,
                  recaptcha:
                    '로봇 인증 중 오류가 발생했습니다.',
                }),
              );
            }}
          />
        </div>

        {errors.recaptcha && (
          <p
            className="auth-form__field-error"
            role="alert"
          >
            {errors.recaptcha}
          </p>
        )}

        <label className="login-form__remember-me">
          <input
            type="checkbox"
            checked={isRememberMeChecked}
            onChange={(event) =>
              setIsRememberMeChecked(
                event.target.checked,
              )
            }
            disabled={isLoading}
          />

          <span>자동 로그인</span>
        </label>

        {successMessage && (
          <div
            className="auth-form__message auth-form__message--success"
            role="status"
          >
            {successMessage}
          </div>
        )}

        <button
          className="auth-form__submit"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>

        <div className="login-form__links">
          <a
            className="login-form__link"
            href="/find-password"
          >
            비밀번호 찾기
          </a>

          <span
            className="login-form__links-divider"
            aria-hidden="true"
          >
            |
          </span>

          <a
            className="login-form__link"
            href="/signup"
          >
            회원가입
          </a>
        </div>

        <p className="auth-form__hint login-form__hint--center">
          ※ 비밀번호 유효기간(반기 1회 변경)
          만료 시 재설정이 안내됩니다.
        </p>
      </form>
    </div>
  );
}

export default LoginForm;