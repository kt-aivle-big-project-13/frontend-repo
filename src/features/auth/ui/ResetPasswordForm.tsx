import {
  type ChangeEvent,
  type FormEvent,
  useState,
} from 'react';

import { resetPassword } from '../api/passwordApi';

import './ResetPasswordForm.css';

interface ResetPasswordFormProps {
  token: string;
}

interface ResetPasswordFormState {
  newPassword: string;
  newPasswordConfirm: string;
}

interface ResetPasswordFormErrors {
  newPassword: string;
  newPasswordConfirm: string;
  submit: string;
}

const INITIAL_FORM: ResetPasswordFormState = {
  newPassword: '',
  newPasswordConfirm: '',
};

const INITIAL_ERRORS: ResetPasswordFormErrors = {
  newPassword: '',
  newPasswordConfirm: '',
  submit: '',
};

const PASSWORD_PATTERN =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{10,16}$/;

function ResetPasswordForm({
  token,
}: ResetPasswordFormProps) {
  const [form, setForm] =
    useState<ResetPasswordFormState>(INITIAL_FORM);

  const [errors, setErrors] =
    useState<ResetPasswordFormErrors>(INITIAL_ERRORS);

  const [successMessage, setSuccessMessage] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(false);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const fieldName =
      event.target
        .name as keyof ResetPasswordFormState;

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
    const nextErrors: ResetPasswordFormErrors = {
      newPassword: '',
      newPasswordConfirm: '',
      submit: '',
    };

    if (!form.newPassword) {
      nextErrors.newPassword =
        '새 비밀번호를 입력해주세요.';
    } else if (
      !PASSWORD_PATTERN.test(form.newPassword)
    ) {
      nextErrors.newPassword =
        '영문, 숫자, 특수문자를 조합하여 10~16자로 입력해주세요.';
    }

    if (!form.newPasswordConfirm) {
      nextErrors.newPasswordConfirm =
        '새 비밀번호를 다시 입력해주세요.';
    } else if (
      form.newPassword !== form.newPasswordConfirm
    ) {
      nextErrors.newPasswordConfirm =
        '비밀번호가 일치하지 않습니다.';
    }

    setErrors(nextErrors);

    return (
      !nextErrors.newPassword &&
      !nextErrors.newPasswordConfirm
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!token) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        submit:
          '유효하지 않은 비밀번호 재설정 링크입니다.',
      }));

      return;
    }

    try {
      setIsLoading(true);
      setSuccessMessage('');

      setErrors((previousErrors) => ({
        ...previousErrors,
        submit: '',
      }));

      const response = await resetPassword({
        token,
        newPassword: form.newPassword,
      });

      setSuccessMessage(
        response.message ??
          '비밀번호가 성공적으로 변경되었습니다.',
      );

      setForm(INITIAL_FORM);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '비밀번호 변경에 실패했습니다.';

      setErrors((previousErrors) => ({
        ...previousErrors,
        submit: errorMessage,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-password-form">
      <header className="reset-password-form__header">
        <h2>새 비밀번호 설정하기</h2>
      </header>

      <form
        className="reset-password-form__body"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="reset-password-form__field">
          <label htmlFor="reset-password">
            새 비밀번호
          </label>

          <input
            id="reset-password"
            name="newPassword"
            type="password"
            value={form.newPassword}
            onChange={handleChange}
            autoComplete="new-password"
            disabled={isLoading}
            aria-invalid={Boolean(
              errors.newPassword,
            )}
            aria-describedby={
              errors.newPassword
                ? 'reset-password-error'
                : 'reset-password-guide'
            }
          />

          <p
            id="reset-password-guide"
            className="reset-password-form__guide"
          >
            영문, 숫자, 특수문자를 조합하여
            10~16자리로 입력해주세요.
          </p>

          {errors.newPassword && (
            <p
              id="reset-password-error"
              className="reset-password-form__field-error"
              role="alert"
            >
              {errors.newPassword}
            </p>
          )}
        </div>

        <div className="reset-password-form__field">
          <label htmlFor="reset-password-confirm">
            새 비밀번호 확인
          </label>

          <input
            id="reset-password-confirm"
            name="newPasswordConfirm"
            type="password"
            value={form.newPasswordConfirm}
            onChange={handleChange}
            autoComplete="new-password"
            disabled={isLoading}
            aria-invalid={Boolean(
              errors.newPasswordConfirm,
            )}
            aria-describedby={
              errors.newPasswordConfirm
                ? 'reset-password-confirm-error'
                : undefined
            }
          />

          {errors.newPasswordConfirm && (
            <p
              id="reset-password-confirm-error"
              className="reset-password-form__field-error"
              role="alert"
            >
              {errors.newPasswordConfirm}
            </p>
          )}
        </div>

        {errors.submit && (
          <div
            className="reset-password-form__message reset-password-form__message--error"
            role="alert"
          >
            {errors.submit}
          </div>
        )}

        {successMessage && (
          <div
            className="reset-password-form__message reset-password-form__message--success"
            role="status"
          >
            {successMessage}
          </div>
        )}

        <button
          className="reset-password-form__submit"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? '변경 중...' : '완료'}
        </button>
      </form>
    </div>
  );
}

export default ResetPasswordForm;