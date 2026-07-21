import {
  type ChangeEvent,
  type FormEvent,
  useState,
} from 'react';

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
  const setAuth = useAuthStore((state) => state.setAuth);

  const [form, setForm] =
    useState<LoginFormState>(INITIAL_FORM);

  const [errors, setErrors] =
    useState<LoginErrors>(INITIAL_ERRORS);

  const [isRecaptchaChecked, setIsRecaptchaChecked] =
    useState(false);

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

  const handleRecaptchaChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setIsRecaptchaChecked(event.target.checked);

    setErrors((previousErrors) => ({
      ...previousErrors,
      recaptcha: '',
    }));
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

    if (!isRecaptchaChecked) {
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
      });

      setAuth(response.accessToken, response.user);
      setSuccessMessage('로그인되었습니다.');
    } catch (error: unknown) {
      // 로그인 실패 시 구체적인 사유는 노출하지 않음
      const errorMessage =
        error instanceof Error
          ? error.message
          : '이메일 또는 비밀번호를 확인해주세요.';

      setErrors((previousErrors) => ({
        ...previousErrors,
        submit: errorMessage,
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
            aria-invalid={Boolean(errors.email)}
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
            autoComplete="off"
            disabled={isLoading}
            aria-invalid={Boolean(errors.password || errors.submit)}
            aria-describedby={
              errors.password
                ? 'login-password-error'
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
            <p className="auth-form__field-error" role="alert">
              {errors.submit}
            </p>
          )}
        </div>

        <div className="login-form__recaptcha">
          <label className="login-form__recaptcha-check">
            <input
              type="checkbox"
              checked={isRecaptchaChecked}
              onChange={handleRecaptchaChange}
              disabled={isLoading}
              aria-invalid={Boolean(errors.recaptcha)}
            />
            <span>로봇이 아닙니다.</span>
          </label>

          <span className="login-form__recaptcha-badge">
            reCAPTCHA
            <br />
            개인정보 보호 · 약관
          </span>
        </div>

        {errors.recaptcha && (
          <p className="auth-form__field-error">
            {errors.recaptcha}
          </p>
        )}

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
          ※ 비밀번호 유효기간(반기 1회 변경) 만료 시 재설정이 안내됩니다.
        </p>
      </form>
    </div>
  );
}

export default LoginForm;
