import { type ReactNode, useEffect, useState } from 'react';

import { useAuthStore } from '../../../entities/user/model/authStore';
import { setApiAccessToken } from '../../../shared/api/client';
import { reissue } from '../api/loginApi';

interface AuthInitializerProps {
  children: ReactNode;
}

function AuthInitializer({
  children,
}: AuthInitializerProps) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [isInitialized, setIsInitialized] =
    useState(false);

  useEffect(() => {
    const restoreAuth = async () => {
      const refreshToken =
        localStorage.getItem('refreshToken') ??
        sessionStorage.getItem('refreshToken');

      if (!refreshToken) {
        setIsInitialized(true);
        return;
      }

      try {
        const response = await reissue(refreshToken);

        const user = {
          id: response.userId,
          email: response.email,
          name: response.name,
          role: response.role,
        };

        setAuth(response.accessToken, user);
        setApiAccessToken(response.accessToken);

        if (localStorage.getItem('refreshToken')) {
          localStorage.setItem(
            'refreshToken',
            response.refreshToken,
          );
        } else {
          sessionStorage.setItem(
            'refreshToken',
            response.refreshToken,
          );
        }
      } catch {
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('refreshToken');
        setApiAccessToken(null);
        clearAuth();
      } finally {
        setIsInitialized(true);
      }
    };

    void restoreAuth();
  }, [clearAuth, setAuth]);

  if (!isInitialized) {
    return null;
  }

  return children;
}

export default AuthInitializer;