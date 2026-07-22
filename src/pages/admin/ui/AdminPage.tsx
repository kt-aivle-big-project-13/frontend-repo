import { useState } from 'react';

import { useIsAdmin } from '../../../entities/user/model/permissions';
import MainLayout from '../../../widgets/layout/ui/MainLayout';

import ActivityLogSection from './sections/ActivityLogSection';
import RoleBoardSection, {
  type RoleMember,
} from './sections/RoleBoardSection';
import './AdminPage.css';

function AdminPage() {
  const isAdmin = useIsAdmin();
  const [selectedLogMember, setSelectedLogMember] =
    useState<RoleMember | null>(null);

  return (
    <MainLayout>
      <div className="admin-page">
        {isAdmin ? (
          <>
            <header className="admin-page__header">
              <h1 className="admin-page__title">회원 및 권한 관리</h1>
              <p className="admin-page__subtitle">
                관리자 계정에게만 노출되는 화면입니다. 사용자/편집자는 화면
                구성이 동일하며 권한 차이로만 기능이 제한됩니다
              </p>
            </header>

            <p className="admin-page__banner">
              <span className="admin-page__banner-highlight">
                권한 정의 — 사용자: 열람·다운로드 → 편집자: + 감사 직접 실행
                → 관리자: + 권한 부여
              </span>
              <span className="admin-page__banner-note">
                {' '}
                · 사용자가 실행/업로드 시도 시 &quot;편집 권한이
                필요합니다&quot; 안내가 노출됩니다
              </span>
            </p>

            <RoleBoardSection onViewLog={setSelectedLogMember} />

            <ActivityLogSection
              key={selectedLogMember?.email ?? 'all'}
              selectedMember={selectedLogMember}
              onBack={() => setSelectedLogMember(null)}
            />
          </>
        ) : (
          <p className="admin-page__denied" role="alert">
            관리자 권한이 필요합니다.
          </p>
        )}
      </div>
    </MainLayout>
  );
}

export default AdminPage;
