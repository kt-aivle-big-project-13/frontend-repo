import {
  type ChangeEvent,
  type FormEvent,
  useState,
} from 'react';

import { findPassword } from '../api/passwordApi';

import './FindPasswordForm.css';

interface FindPasswordFormState {
  name: string;
  email: string;
}

interface FindPasswordErrors {
  name: string;
  email: string;
  submit: string;
}

const INITIAL_FORM: FindPasswordFormState = {
  name: '',
  email: '',
};

const INITIAL_ERRORS: FindPasswordErrors = {
  name: '',
  email: '',
  submit: '',
};

function FindPasswordForm() {
  const [form, setForm] =
    useState<FindPasswordFormState>(INITIAL_FORM);

  const [errors, setErrors] =
    useState<FindPasswordErrors>(INITIAL_ERRORS);

  const [successMessage, setSuccessMessage] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(false);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const fieldName =
      event.target.name as keyof FindPasswordFormState;

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
    const nextErrors: FindPasswordErrors = {
      name: '',
      email: '',
      submit: '',
    };

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedName) {
      nextErrors.name =
        '이름을 입력해주세요.';
    }

    if (!trimmedEmail) {
      nextErrors.email =
        '이메일을 입력해주세요.';
    } else if (!emailPattern.test(trimmedEmail)) {
      nextErrors.email =
        '올바른 이메일 형식을 입력해주세요.';
    }

    setErrors(nextErrors);

    return (
      !nextErrors.name &&
      !nextErrors.email
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

      const response = await findPassword({
        name: form.name.trim(),
        email: form.email.trim(),
      });

      setSuccessMessage(
        response.message ??
          '비밀번호 재설정 링크가 이메일로 발송되었습니다.',
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '비밀번호 재설정 링크 발송에 실패했습니다.';

      setErrors((previousErrors) => ({
        ...previousErrors,
        submit: errorMessage,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="find-password-form">
      <header className="find-password-form__header">
        <h2>비밀번호 찾기</h2>

        <p>
          가입했던 이메일을 입력해주세요.
          비밀번호 재설정 이메일을 보내드립니다.
        </p>
      </header>

      <form
        className="find-password-form__body"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="find-password-form__field">
          <label htmlFor="find-password-name">
            이름
          </label>

          <input
            id="find-password-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
            disabled={isLoading}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={
              errors.name
                ? 'find-password-name-error'
                : undefined
            }
          />

          {errors.name && (
            <p
              id="find-password-name-error"
              className="find-password-form__field-error"
            >
              {errors.name}
            </p>
          )}
        </div>

        <div className="find-password-form__field">
          <label htmlFor="find-password-email">
            이메일
          </label>

          <input
            id="find-password-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            disabled={isLoading}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email
                ? 'find-password-email-error'
                : undefined
            }
          />

          {errors.email && (
            <p
              id="find-password-email-error"
              className="find-password-form__field-error"
            >
              {errors.email}
            </p>
          )}
        </div>

        {errors.submit && (
          <div
            className="
              find-password-form__message
              find-password-form__message--error
            "
            role="alert"
          >
            {errors.submit}
          </div>
        )}

        {successMessage && (
          <div
            className="
              find-password-form__message
              find-password-form__message--success
            "
            role="status"
          >
            {successMessage}
          </div>
        )}

        <button
          className="find-password-form__submit"
          type="submit"
          disabled={isLoading}
        >
          {isLoading
            ? '재설정 링크 발송 중...'
            : '비밀번호 재설정하기'}
        </button>

        <a
          className="find-password-form__login-link"
          href="/login"
        >
          로그인
        </a>
      </form>
    </div>
  );
}

export default FindPasswordForm;