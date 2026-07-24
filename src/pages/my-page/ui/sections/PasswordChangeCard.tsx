import { useState } from 'react';

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

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M1.5 9C1.5 9 4.5 3.5 9 3.5C13.5 3.5 16.5 9 16.5 9C16.5 9 13.5 14.5 9 14.5C4.5 14.5 1.5 9 1.5 9Z"
          stroke="currentColor"
          strokeWidth="1.3"
        />
        <circle cx="9" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M2.5 2.5L15.5 15.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M4.7 4.9C2.7 6.1 1.5 9 1.5 9C1.5 9 4.5 14.5 9 14.5C10.4 14.5 11.6 14 12.6 13.3M7.3 3.7C7.85 3.58 8.42 3.5 9 3.5C13.5 3.5 16.5 9 16.5 9C16.5 9 15.9 10.1 14.9 11.2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface PasswordFieldProps {
  id: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

function PasswordField({ id, value, disabled, onChange }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="my-page__password-input">
      <input
        id={id}
        type={isVisible ? 'text' : 'password'}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className="my-page__password-toggle"
        onMouseDown={() => setIsVisible(true)}
        onMouseUp={() => setIsVisible(false)}
        onMouseLeave={() => setIsVisible(false)}
        onTouchStart={() => setIsVisible(true)}
        onTouchEnd={() => setIsVisible(false)}
        aria-label="누르고 있는 동안 비밀번호 보기"
      >
        <EyeIcon open={isVisible} />
      </button>
    </div>
  );
}

function PasswordChangeCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isChanged, setIsChanged] = useState(false);

  const handleVerify = () => {
    if (!currentPassword) return;
    setIsVerified(true);
  };

  const isNewPasswordInvalid = newPassword.length > 0 && !isPasswordValid(newPassword);
  const isConfirmMismatched =
    newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm;

  const canChangePassword =
    isVerified &&
    isPasswordValid(newPassword) &&
    newPassword === newPasswordConfirm;

  const handleChangePassword = () => {
    if (!canChangePassword) return;

    setIsChanged(true);
    setCurrentPassword('');
    setIsVerified(false);
    setNewPassword('');
    setNewPasswordConfirm('');
  };

  return (
    <section className="my-page__card">
      <div className="my-page__card-header">
        <h2 className="my-page__card-title">비밀번호 변경</h2>
        <button
          type="button"
          className="my-page__save-button"
          disabled={!canChangePassword}
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
            }}
          />
          <button
            type="button"
            className="my-page__verify-button"
            disabled={!currentPassword || isVerified}
            onClick={handleVerify}
          >
            확인
          </button>
        </div>
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
        영문·숫자·특수문자 2종류 이상 조합 10~16자 · SHA-256으로 암호화되어
        저장됩니다
      </p>

      {isChanged && (
        <p className="my-page__save-message">
          새 비밀번호로 변경되었습니다.
        </p>
      )}
    </section>
  );
}

export default PasswordChangeCard;
