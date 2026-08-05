import { useState } from 'react';

import {
  updateNotificationPreferences,
  type MyProfileResponse,
} from '../../../../features/my-page/api/myPageApi';

interface NotificationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

function NotificationToggle({
  label,
  description,
  checked,
  disabled,
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
        disabled={disabled}
        className={`my-page__toggle${checked ? ' my-page__toggle--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="my-page__toggle-knob" />
      </button>
    </div>
  );
}

interface NotificationSettingsCardProps {
  profile: MyProfileResponse | null;
}

type PreferenceKey =
  | 'lawEmailEnabled'
  | 'reauditAlertEnabled'
  | 'auditCompleteAlertEnabled'
  | 'auditFailAlertEnabled';

// MyPage가 profile 로딩 완료 시 key를 바꿔 이 컴포넌트를 다시 마운트시키므로,
// 초기 state는 그 시점의 profile 값을 그대로 반영한다(useEffect로 동기화할 필요 없음).
function NotificationSettingsCard({ profile }: NotificationSettingsCardProps) {
  const [isLawAlertOn, setIsLawAlertOn] = useState(profile?.lawEmailEnabled ?? true);
  const [isReauditAlertOn, setIsReauditAlertOn] = useState(
    profile?.reauditAlertEnabled ?? true,
  );
  const [isAuditCompleteAlertOn, setIsAuditCompleteAlertOn] = useState(
    profile?.auditCompleteAlertEnabled ?? true,
  );
  const [isAuditFailAlertOn, setIsAuditFailAlertOn] = useState(
    profile?.auditFailAlertEnabled ?? true,
  );
  const [savingKey, setSavingKey] = useState<PreferenceKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async (key: PreferenceKey, nextValue: boolean) => {
    const previous = {
      lawEmailEnabled: isLawAlertOn,
      reauditAlertEnabled: isReauditAlertOn,
      auditCompleteAlertEnabled: isAuditCompleteAlertOn,
      auditFailAlertEnabled: isAuditFailAlertOn,
    };
    const next = { ...previous, [key]: nextValue };

    setError(null);
    setSavingKey(key);

    if (key === 'lawEmailEnabled') setIsLawAlertOn(nextValue);
    if (key === 'reauditAlertEnabled') setIsReauditAlertOn(nextValue);
    if (key === 'auditCompleteAlertEnabled') setIsAuditCompleteAlertOn(nextValue);
    if (key === 'auditFailAlertEnabled') setIsAuditFailAlertOn(nextValue);

    try {
      await updateNotificationPreferences(next);
    } catch {
      // 저장 실패 시 이전 값으로 되돌린다.
      if (key === 'lawEmailEnabled') setIsLawAlertOn(previous.lawEmailEnabled);
      if (key === 'reauditAlertEnabled') setIsReauditAlertOn(previous.reauditAlertEnabled);
      if (key === 'auditCompleteAlertEnabled') {
        setIsAuditCompleteAlertOn(previous.auditCompleteAlertEnabled);
      }
      if (key === 'auditFailAlertEnabled') {
        setIsAuditFailAlertOn(previous.auditFailAlertEnabled);
      }

      setError('알림 설정 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSavingKey(null);
    }
  };

  const isDisabled = savingKey !== null;

  return (
    <section className="my-page__card">
      <h2 className="my-page__card-title">알림 설정</h2>

      <NotificationToggle
        label="법령 개정 이메일 알림"
        description="관련 법령·고시 개정 시 이메일로 안내"
        checked={isLawAlertOn}
        disabled={isDisabled}
        onChange={(value) => save('lawEmailEnabled', value)}
      />
      <NotificationToggle
        label="재감사 권고 알림"
        description="감사 결과 재감사가 필요한 모델 발생 시 안내"
        checked={isReauditAlertOn}
        disabled={isDisabled}
        onChange={(value) => save('reauditAlertEnabled', value)}
      />
      <NotificationToggle
        label="감사 완료 알림"
        description="진행 중인 감사가 완료되면 안내"
        checked={isAuditCompleteAlertOn}
        disabled={isDisabled}
        onChange={(value) => save('auditCompleteAlertEnabled', value)}
      />
      <NotificationToggle
        label="감사 실패 알림"
        description="진행 중인 감사가 실패하면 안내"
        checked={isAuditFailAlertOn}
        disabled={isDisabled}
        onChange={(value) => save('auditFailAlertEnabled', value)}
      />

      {error && (
        <p className="my-page__field-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export default NotificationSettingsCard;