import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  type SubmitHandler,
} from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import '../../../shared/ui/authForm.css';
import { resetPassword } from '../api/passwordApi';

interface ResetPasswordFormProps {
  token: string;
}

const PASSWORD_POLICY_MESSAGE =
  `영문, 숫자, 특수문자( ( ) < > " ' ; 제외 ) 중 2종류를 조합하여 10~16자리, 3종류는 8~16자리로 입력해주세요.`;

function isValidPassword(
  password: string,
): boolean {
  const hasLetter =
    /[A-Za-z]/.test(password);

  const hasNumber =
    /[0-9]/.test(password);

  const hasSpecial =
    /[^A-Za-z0-9]/.test(password);

  const hasExcludedCharacter =
    /[()<>"';]/.test(password);

  const hasWhitespace =
    /\s/.test(password);

  if (
    hasExcludedCharacter ||
    hasWhitespace
  ) {
    return false;
  }

  const typeCount = [
    hasLetter,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  const length = password.length;

  if (typeCount === 2) {
    return (
      length >= 10 &&
      length <= 16
    );
  }

  if (typeCount === 3) {
    return (
      length >= 8 &&
      length <= 16
    );
  }

  return false;
}

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(
        1,
        '새 비밀번호를 입력해주세요.',
      )
      .refine(
        isValidPassword,
        PASSWORD_POLICY_MESSAGE,
      ),

    newPasswordConfirm: z
      .string()
      .min(
        1,
        '새 비밀번호를 다시 입력해주세요.',
      ),
  })
  .refine(
    (data) =>
      data.newPassword ===
      data.newPasswordConfirm,
    {
      message:
        '비밀번호가 일치하지 않습니다.',
      path: ['newPasswordConfirm'],
    },
  );

type ResetPasswordFormValues =
  z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm({
  token,
}: ResetPasswordFormProps) {
  const navigate = useNavigate();

  const [submitError, setSubmitError] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(
      resetPasswordSchema,
    ),
    defaultValues: {
      newPassword: '',
      newPasswordConfirm: '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const onSubmit: SubmitHandler<
    ResetPasswordFormValues
  > = async (data) => {
    setSubmitError('');
    setSuccessMessage('');

    if (!token) {
      setSubmitError(
        '유효하지 않은 비밀번호 재설정 링크입니다.',
      );

      return;
    }

    try {
      const response =
        await resetPassword({
          resetToken: token,
          newPassword:
            data.newPassword,
          newPasswordConfirm:
            data.newPasswordConfirm,
        });

      setSuccessMessage(
        response.message ??
          '비밀번호가 성공적으로 변경되었습니다.',
      );

      reset();

      window.setTimeout(() => {
        navigate('/login', {
          replace: true,
        });
      }, 1000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : '비밀번호 변경에 실패했습니다.';

      setSubmitError(errorMessage);
    }
  };

  return (
    <div className="auth-form">
      <header className="auth-form__header">
        <h2>
          새 비밀번호 설정하기
        </h2>
      </header>

      <form
        className="auth-form__body"
        onSubmit={handleSubmit(
          onSubmit,
        )}
        noValidate
      >
        <div className="auth-form__field">
          <label htmlFor="reset-password">
            새 비밀번호
          </label>

          <input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={Boolean(
              errors.newPassword,
            )}
            aria-describedby={
              errors.newPassword
                ? 'reset-password-error'
                : 'reset-password-guide'
            }
            {...register(
              'newPassword',
              {
                onChange: () => {
                  setSubmitError('');
                  setSuccessMessage('');
                },
              },
            )}
          />

          {errors.newPassword
            ?.message && (
            <p
              id="reset-password-error"
              className="auth-form__field-error"
              role="alert"
            >
              {
                errors.newPassword
                  .message
              }
            </p>
          )}
        </div>

        <div className="auth-form__field">
          <label htmlFor="reset-password-confirm">
            새 비밀번호 확인
          </label>

          <input
            id="reset-password-confirm"
            type="password"
            autoComplete="new-password"
            disabled={isSubmitting}
            aria-invalid={Boolean(
              errors.newPasswordConfirm,
            )}
            aria-describedby={
              errors.newPasswordConfirm
                ? 'reset-password-confirm-error'
                : undefined
            }
            {...register(
              'newPasswordConfirm',
              {
                onChange: () => {
                  setSubmitError('');
                  setSuccessMessage('');
                },
              },
            )}
          />

          {errors
            .newPasswordConfirm
            ?.message && (
            <p
              id="reset-password-confirm-error"
              className="auth-form__field-error"
              role="alert"
            >
              {
                errors
                  .newPasswordConfirm
                  .message
              }
            </p>
          )}
        </div>

        {submitError && (
          <div
            className="auth-form__message auth-form__message--error"
            role="alert"
          >
            {submitError}
          </div>
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
          disabled={
            isSubmitting ||
            Boolean(successMessage)
          }
        >
          {isSubmitting
            ? '변경 중...'
            : '완료'}
        </button>
      </form>
    </div>
  );
}

export default ResetPasswordForm;