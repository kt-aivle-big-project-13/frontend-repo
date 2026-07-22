import { Link, type LinkProps } from 'react-router-dom';

import { useAuthStore } from '../model/authStore';

function AuthGatedLink({ to, ...props }: LinkProps) {
  const isAuthenticated = useAuthStore((state) => Boolean(state.user));

  return <Link to={isAuthenticated ? to : '/login'} {...props} />;
}

export default AuthGatedLink;
