import { useState, type DragEvent } from 'react';

import { useAuthStore } from '../../../../entities/user/model/authStore';
import { maskEmail } from '../../../../shared/lib/maskEmail';
import { maskName } from '../../../../shared/lib/maskName';

import './RoleBoardSection.css';

export interface RoleMember {
  id: string;
  name: string;
  email: string;
  highlighted?: boolean;
}

// TODO: 실제 회원 목록 API 연동 전까지는 빈 배열이 기본값
// (관리자 목록만 예외 — role이 admin인 계정만 노출되며, 이 페이지 자체가
// 관리자 계정에게만 보이므로 접근 통제는 AdminPage의 isAdmin 가드가 담당)
const INITIAL_USERS: RoleMember[] = [];

const INITIAL_EDITORS: RoleMember[] = [];

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M1.5 3.5H12.5M5.25 3.5V2C5.25 1.586 5.586 1.25 6 1.25H8C8.414 1.25 8.75 1.586 8.75 2V3.5M10.75 3.5V11.5C10.75 12.052 10.302 12.5 9.75 12.5H4.25C3.698 12.5 3.25 12.052 3.25 11.5V3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface RoleColumnProps {
  title: string;
  roleLabel: string;
  description: string;
  descriptionVariant?: 'editor' | 'admin';
  members: RoleMember[];
  columnKey: 'user' | 'editor' | 'admin';
  draggable: boolean;
  deletable: boolean;
  isDragOver: boolean;
  onDragStartMember?: (member: RoleMember) => void;
  onDragOverColumn?: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeaveColumn?: () => void;
  onDropColumn?: (event: DragEvent<HTMLDivElement>) => void;
  onDelete: (member: RoleMember) => void;
  onViewLog: (member: RoleMember) => void;
}

function RoleColumn({
  title,
  roleLabel,
  description,
  descriptionVariant,
  members,
  columnKey,
  draggable,
  deletable,
  isDragOver,
  onDragStartMember,
  onDragOverColumn,
  onDragLeaveColumn,
  onDropColumn,
  onDelete,
  onViewLog,
}: RoleColumnProps) {
  const handleDeleteClick = (member: RoleMember) => {
    const confirmed = window.confirm(
      `정말로 ${member.name}(${maskEmail(member.email)}) ${roleLabel} 계정을 삭제하시겠습니까?`,
    );

    if (confirmed) {
      onDelete(member);
    }
  };

  return (
    <div
      className={`role-board-section__column role-board-section__column--${columnKey}${isDragOver ? ' role-board-section__column--drag-over' : ''}`}
      onDragOver={onDragOverColumn}
      onDragLeave={onDragLeaveColumn}
      onDrop={onDropColumn}
    >
      <h3 className="role-board-section__column-title">
        {title}
        <span className="role-board-section__column-count">
          {members.length}명
        </span>
      </h3>
      <p
        className={
          descriptionVariant
            ? `role-board-section__column-description role-board-section__column-description--${descriptionVariant}`
            : 'role-board-section__column-description'
        }
      >
        {description}
      </p>

      <div className="role-board-section__members">
        {members.length === 0 ? (
          <p className="role-board-section__empty">
            아직 등록된 {title}가 없습니다.
          </p>
        ) : (
          members.map((member) => (
          <div
            key={member.id}
            draggable={draggable}
            onDragStart={() => onDragStartMember?.(member)}
            className={[
              'role-board-section__member',
              draggable ? 'role-board-section__member--draggable' : '',
              member.highlighted
                ? 'role-board-section__member--highlighted'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="role-board-section__member-info">
              <p className="role-board-section__member-name">
                {member.name}
              </p>
              <p className="role-board-section__member-email">
                {maskEmail(member.email)}
              </p>
            </div>

            <div className="role-board-section__member-actions">
              <button
                type="button"
                className="role-board-section__log-button"
                onClick={() => onViewLog(member)}
              >
                로그 보기
              </button>

              {deletable && (
                <button
                  type="button"
                  className="role-board-section__delete-button"
                  onClick={() => handleDeleteClick(member)}
                  aria-label={`${member.name} 계정 삭제`}
                >
                  <TrashIcon />
                </button>
              )}
            </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface RoleBoardSectionProps {
  onViewLog: (member: RoleMember) => void;
}

function RoleBoardSection({ onViewLog }: RoleBoardSectionProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [editors, setEditors] = useState(INITIAL_EDITORS);
  const [admins, setAdmins] = useState<RoleMember[]>(() =>
    currentUser?.role === 'admin'
      ? [
          {
            id: currentUser.id,
            name: maskName(currentUser.name),
            email: currentUser.email,
            highlighted: true,
          },
        ]
      : [],
  );
  const [dragOverColumn, setDragOverColumn] = useState<
    'user' | 'editor' | null
  >(null);
  const [draggedMember, setDraggedMember] = useState<{
    member: RoleMember;
    from: 'user' | 'editor';
  } | null>(null);

  const handleDrop =
    (to: 'user' | 'editor') => (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOverColumn(null);

      if (!draggedMember || draggedMember.from === to) {
        return;
      }

      const { member, from } = draggedMember;

      if (from === 'user') {
        setUsers((prev) => prev.filter((item) => item.id !== member.id));
        setEditors((prev) => [...prev, member]);
      } else {
        setEditors((prev) => prev.filter((item) => item.id !== member.id));
        setUsers((prev) => [...prev, member]);
      }

      setDraggedMember(null);
    };

  const handleDelete =
    (from: 'user' | 'editor' | 'admin') => (member: RoleMember) => {
      if (from === 'user') {
        setUsers((prev) => prev.filter((item) => item.id !== member.id));
      } else if (from === 'editor') {
        setEditors((prev) => prev.filter((item) => item.id !== member.id));
      } else {
        setAdmins((prev) => prev.filter((item) => item.id !== member.id));
      }
    };

  return (
    <div className="role-board-section">
      <RoleColumn
        title="사용자"
        roleLabel="사용자"
        description="열람 · 다운로드만"
        members={users}
        columnKey="user"
        draggable
        deletable
        isDragOver={dragOverColumn === 'user'}
        onDragStartMember={(member) =>
          setDraggedMember({ member, from: 'user' })
        }
        onDragOverColumn={(event) => {
          event.preventDefault();
          setDragOverColumn('user');
        }}
        onDragLeaveColumn={() => setDragOverColumn(null)}
        onDropColumn={handleDrop('user')}
        onDelete={handleDelete('user')}
        onViewLog={onViewLog}
      />

      <RoleColumn
        title="편집자"
        roleLabel="편집자"
        description="+ 감사 직접 실행"
        descriptionVariant="editor"
        members={editors}
        columnKey="editor"
        draggable
        deletable
        isDragOver={dragOverColumn === 'editor'}
        onDragStartMember={(member) =>
          setDraggedMember({ member, from: 'editor' })
        }
        onDragOverColumn={(event) => {
          event.preventDefault();
          setDragOverColumn('editor');
        }}
        onDragLeaveColumn={() => setDragOverColumn(null)}
        onDropColumn={handleDrop('editor')}
        onDelete={handleDelete('editor')}
        onViewLog={onViewLog}
      />

      <RoleColumn
        title="관리자"
        roleLabel="관리자"
        description="+ 권한 부여"
        descriptionVariant="admin"
        members={admins}
        columnKey="admin"
        draggable={false}
        deletable={false}
        isDragOver={false}
        onDelete={handleDelete('admin')}
        onViewLog={onViewLog}
      />
    </div>
  );
}

export default RoleBoardSection;
