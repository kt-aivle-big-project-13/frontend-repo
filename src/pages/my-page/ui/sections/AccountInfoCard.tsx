import { useState } from 'react';

import type { User } from '../../../../entities/user/model/authStore';
import { maskEmail } from '../../../../shared/lib/maskEmail';

interface AccountInfoCardProps {
  user: User;
}

function AccountInfoCard({ user }: AccountInfoCardProps) {
  const [name, setName] = useState(user.name);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
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
        {isSaved && (
          <span className="my-page__save-message">저장되었습니다.</span>
        )}
        <button
          type="button"
          className="my-page__save-button"
          onClick={handleSave}
        >
          저장
        </button>
      </div>
    </section>
  );
}

export default AccountInfoCard;
