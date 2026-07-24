import { Link, type LinkProps } from 'react-router-dom';

import { useAuthStore } from '../model/authStore';
import { useLoginPromptStore } from '../model/loginPromptStore';

function AuthGatedLink({ to, className, children, ...props }: LinkProps) {
  const isAuthenticated = useAuthStore((state) => Boolean(state.user));
  const showLoginPrompt = useLoginPromptStore((state) => state.show);

  if (isAuthenticated) {
    return (
      <Link to={to} className={className} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      className={className}
      style={{ cursor: 'pointer' }}
      onClick={showLoginPrompt}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          showLoginPrompt();
        }
      }}
    >
      {children}
    </span>
  );
}

export default AuthGatedLink;
