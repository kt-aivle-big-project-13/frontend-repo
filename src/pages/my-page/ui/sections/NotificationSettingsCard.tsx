import { useState } from 'react';

interface NotificationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
}: NotificationToggleProps) {
  return (
    <div className="my-page__toggle-row">
      <div className="my-page__toggle-text">
        <p className="my-page__toggle-label">{label}</p>
        <p className="my-page__toggle-description">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`my-page__toggle${checked ? ' my-page__toggle--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="my-page__toggle-knob" />
      </button>
    </div>
  );
}

function NotificationSettingsCard() {
  const [isLawAlertOn, setIsLawAlertOn] = useState(true);
  const [isReauditAlertOn, setIsReauditAlertOn] = useState(true);

  return (
    <section className="my-page__card">
      <h2 className="my-page__card-title">알림 설정</h2>

      <NotificationToggle
        label="법령 개정 SMS 알림"
        description="관련 법령·고시 개정 시 즉시 문자로 안내"
        checked={isLawAlertOn}
        onChange={setIsLawAlertOn}
      />
      <NotificationToggle
        label="재감사 권고 알림"
        description="법령 개정으로 재감사가 필요한 모델 발생 시 안내"
        checked={isReauditAlertOn}
        onChange={setIsReauditAlertOn}
      />
    </section>
  );
}

export default NotificationSettingsCard;
