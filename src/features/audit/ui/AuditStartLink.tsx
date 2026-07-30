import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'antd';

import { useAuthStore } from '../../../entities/user/model/authStore';
import { useLoginPromptStore } from '../../../entities/user/model/loginPromptStore';

interface AuditStartLinkProps {
  className?: string;
  children: ReactNode;
}

// "감사 시작" 진입점(홈 히어로 CTA, 헤더 내비게이션)에서 공통으로 쓰는 컴포넌트.
// 고영향 AI 모델임이 확실하면 사전진단을 건너뛰고 바로 STEP2 모델 업로드로 이동한다.
function AuditStartLink({ className, children }: AuditStartLinkProps) {
  const isAuthenticated = useAuthStore((state) => Boolean(state.user));
  const showLoginPrompt = useLoginPromptStore((state) => state.show);
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isAuthenticated) {
      showLoginPrompt();
      return;
    }

    Modal.confirm({
      title: '고영향 AI 모델이 확실한가요?',
      content: (
        <>
          여기서 테스트하고자 하는 모델이 고영향 AI 모델인가요?
          <br />
          확실하지 않다면 사전진단을 먼저 진행해 주세요.
        </>
      ),
      okText: '예, 확실합니다',
      cancelText: '아니요, 사전진단 진행',
      centered: true,
      keyboard: false,
      onOk() {
        navigate('/audit');
      },
      onCancel() {
        navigate('/pre-diagnosis');
      },
    });
  };

  return (
    <span
      role="button"
      tabIndex={0}
      className={className}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      }}
    >
      {children}
    </span>
  );
}

export default AuditStartLink;