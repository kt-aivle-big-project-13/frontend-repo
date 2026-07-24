import { useState } from 'react';

import { useAuthStore } from '../../../../entities/user/model/authStore';
import type { User } from '../../../../entities/user/model/authStore';
import { updateMyProfile } from '../../../../features/my-page/api/myPageApi';
import { maskEmail } from '../../../../shared/lib/maskEmail';

interface AccountInfoCardProps {
  user: User;
}

function AccountInfoCard({ user }: AccountInfoCardProps) {
  const updateUserName = useAuthStore((state) => state.updateUserName);
  const [name, setName] = useState(user.name);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const response = await updateMyProfile({ name: name.trim() });
      updateUserName(response.name);
      setIsSaved(true);
    } catch {
      setError('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="my-page__card">
      <h2 className="my-page__card-title">계정 정보</h2>

      <div className="my-page__field-grid">
        <div className="my-page__field">
          <label htmlFor="my-page-name">이름</label>
          <input
            id="my-page-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setIsSaved(false);
              setError(null);
            }}
          />
        </div>

        <div className="my-page__field">
          <label htmlFor="my-page-email">이메일 (변경 불가)</label>
          <input
            id="my-page-email"
            type="text"
            value={maskEmail(user.email)}
            disabled
          />
        </div>
      </div>

      <div className="my-page__card-footer">
        {error && <span className="my-page__field-error">{error}</span>}
        {isSaved && !error && (
          <span className="my-page__save-message">저장되었습니다.</span>
        )}
        <button
          type="button"
          className="my-page__save-button"
          disabled={isSaving || !name.trim()}
          onClick={handleSave}
        >
          저장
        </button>
      </div>
    </section>
  );
}

export default AccountInfoCard;