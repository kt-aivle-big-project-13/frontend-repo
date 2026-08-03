import { useState } from 'react';
import axios from 'axios';

import { changeMyPassword, verifyCurrentPassword } from '../../../../features/my-page/api/myPageApi';
import { extractApiErrorMessage } from '../../../../shared/api/client';
import PasswordField from '../../../../shared/ui/PasswordField';

const HAS_LETTER = /[A-Za-z]/;
const HAS_DIGIT = /\d/;
const HAS_SPECIAL = /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]/;']/;

function countPasswordTypes(password: string): number {
  return [HAS_LETTER, HAS_DIGIT, HAS_SPECIAL].filter((pattern) =>
    pattern.test(password),
  ).length;
}

function isPasswordValid(password: string): boolean {
  return (
    password.length >= 10 &&
    password.length <= 16 &&
    countPasswordTypes(password) >= 2
  );
}

function PasswordChangeCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isChanged, setIsChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!currentPassword) return;

    setIsVerifying(true);
    setVerifyError(null);

    try {
      await verifyCurrentPassword({ currentPassword });
      setIsVerified(true);
    } catch (err) {
      setVerifyError(extractApiErrorMessage(err, '현재 비밀번호가 일치하지 않습니다.'));
    } finally {
      setIsVerifying(false);
    }
  };

  const isNewPasswordInvalid = newPassword.length > 0 && !isPasswordValid(newPassword);
  const isConfirmMismatched =
    newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm;

  const canChangePassword =
    isVerified &&
    isPasswordValid(newPassword) &&
    newPassword === newPasswordConfirm;

  const handleChangePassword = async () => {
    if (!canChangePassword) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await changeMyPassword({
        currentPassword,
        newPassword,
        newPasswordConfirm,
      });

      setIsChanged(true);
      setCurrentPassword('');
      setIsVerified(false);
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err) {
      setError(extractApiErrorMessage(err, '비밀번호 변경에 실패했습니다.'));

      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setIsVerified(false);
        setCurrentPassword('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="my-page__card">
      <div className="my-page__card-header">
        <h2 className="my-page__card-title">비밀번호 변경</h2>
        <button
          type="button"
          className="my-page__save-button"
          disabled={!canChangePassword || isSubmitting}
          onClick={handleChangePassword}
        >
          비밀번호 변경하기
        </button>
      </div>

      <div className="my-page__field">
        <label htmlFor="my-page-current-password">현재 비밀번호</label>
        <div className="my-page__inline-field">
          <PasswordField
            id="my-page-current-password"
            value={currentPassword}
            disabled={isVerified}
            onChange={(value) => {
              setCurrentPassword(value);
              setIsChanged(false);
              setError(null);
              setVerifyError(null);
            }}
          />
          <button
            type="button"
            className="my-page__verify-button"
            disabled={!currentPassword || isVerified || isVerifying}
            onClick={handleVerify}
          >
            확인
          </button>
        </div>
        {verifyError && <p className="my-page__field-error">{verifyError}</p>}
      </div>

      <div className="my-page__field-grid">
        <div className="my-page__field">
          <label htmlFor="my-page-new-password">새 비밀번호</label>
          <PasswordField
            id="my-page-new-password"
            value={newPassword}
            disabled={!isVerified}
            onChange={(value) => {
              setNewPassword(value);
              setIsChanged(false);
            }}
          />
          {isNewPasswordInvalid && (
            <p className="my-page__field-error">
              비밀번호 형식에 맞지 않습니다.
            </p>
          )}
        </div>

        <div className="my-page__field">
          <label htmlFor="my-page-new-password-confirm">새 비밀번호 확인</label>
          <PasswordField
            id="my-page-new-password-confirm"
            value={newPasswordConfirm}
            disabled={!isVerified}
            onChange={(value) => {
              setNewPasswordConfirm(value);
              setIsChanged(false);
            }}
          />
          {isConfirmMismatched && (
            <p className="my-page__field-error">
              비밀번호가 일치하지 않습니다.
            </p>
          )}
        </div>
      </div>

      <p className="my-page__hint">
        영문·숫자·특수문자 2종류 이상 조합 10~16자 · 안전하게 암호화되어 저장됩니다
      </p>

      {error && <p className="my-page__field-error">{error}</p>}

      {isChanged && (
        <p className="my-page__save-message">
          새 비밀번호로 변경되었습니다.
        </p>
      )}
    </section>
  );
}

export default PasswordChangeCard;