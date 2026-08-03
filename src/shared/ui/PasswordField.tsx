import { useEffect, useState, type KeyboardEvent } from 'react';

import './PasswordField.css';

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
  name?: string;
  value: string;
  disabled?: boolean;
  autoComplete?: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

function PasswordField({
  id,
  name,
  value,
  disabled,
  autoComplete,
  ariaInvalid,
  ariaDescribedBy,
  onChange,
  onBlur,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  // 손을 뗀 위치가 버튼 영역을 벗어나 있어도 항상 숨겨지도록 window 레벨에서 release를 감지한다.
  // 버튼에만 onMouseUp/onMouseLeave를 걸면, 커서가 버튼을 살짝 벗어난 채로 손을 뗐을 때
  // release 이벤트가 버튼에서 감지되지 않아 계속 보이는 상태로 남는다.
  // isVisible이 true가 된 "이후"에 리스너를 붙이면 그 사이 짧은 틈에 손을 뗀 경우를 놓치므로,
  // 마운트 시 한 번만 등록해서 그 틈 자체를 없앤다.
  useEffect(() => {
    const hide = () => setIsVisible(false);

    window.addEventListener('mouseup', hide);
    window.addEventListener('touchend', hide);
    window.addEventListener('touchcancel', hide);

    return () => {
      window.removeEventListener('mouseup', hide);
      window.removeEventListener('touchend', hide);
      window.removeEventListener('touchcancel', hide);
    };
  }, []);

  // Space/Enter로 포커스한 키보드 사용자도 "누르고 있는 동안만 보기"를 쓸 수 있도록,
  // 마우스/터치와 별개로 keydown에 보이기·keyup(또는 포커스 이탈)에 숨기기를 붙인다.
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsVisible(true);
    }
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      setIsVisible(false);
    }
  };

  return (
    <div className="password-field">
      <input
        id={id}
        name={name}
        type={isVisible ? 'text' : 'password'}
        value={value}
        disabled={disabled}
        autoComplete={autoComplete}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      <button
        type="button"
        className="password-field__toggle"
        disabled={disabled}
        onMouseDown={() => setIsVisible(true)}
        onTouchStart={() => setIsVisible(true)}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={() => setIsVisible(false)}
        aria-label="누르고 있는 동안 비밀번호 보기"
      >
        <EyeIcon open={isVisible} />
      </button>
    </div>
  );
}

export default PasswordField;