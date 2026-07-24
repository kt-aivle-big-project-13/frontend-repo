import { useEffect } from 'react';

import { useLoginPromptStore } from '../model/loginPromptStore';

import './LoginPromptToast.css';

const AUTO_HIDE_MS = 2000;

function LoginPromptToast() {
  const isVisible = useLoginPromptStore((state) => state.isVisible);
  const hide = useLoginPromptStore((state) => state.hide);

  useEffect(() => {
    if (!isVisible) return;

    const timer = window.setTimeout(hide, AUTO_HIDE_MS);
    return () => window.clearTimeout(timer);
  }, [isVisible, hide]);

  if (!isVisible) return null;

  return (
    <div className="login-prompt-toast" role="status">
      로그인 후 이용 가능합니다
    </div>
  );
}

export default LoginPromptToast;
