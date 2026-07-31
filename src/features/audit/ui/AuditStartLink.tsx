import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal } from 'antd';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    if (!isAuthenticated) {
      showLoginPrompt();
      return;
    }

    setIsModalOpen(true);
  };

  // "예"/"아니요"는 각각 다른 페이지로 이동하지만, 우측 상단 X(및 마스크 클릭)는
  // 아무 페이지로도 이동하지 않고 모달만 닫아야 하므로 onCancel과 분리된 커스텀
  // footer 버튼으로 처리한다.
  return (
    <>
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

      <Modal
        title="고영향 AI 모델"
        open={isModalOpen}
        centered
        closable
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalOpen(false);
              navigate('/pre-diagnosis');
            }}
          >
            아니요, 사전진단 진행
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={() => {
              setIsModalOpen(false);
              navigate('/audit');
            }}
          >
            예, 확실합니다
          </Button>,
        ]}
      >
        여기서 테스트하고자 하는 모델이 고영향 AI 모델인가요?
        <br />
        확실하지 않다면 사전진단을 먼저 진행해 주세요.
      </Modal>
    </>
  );
}

export default AuditStartLink;