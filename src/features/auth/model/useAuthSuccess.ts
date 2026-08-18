import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../../entities/user/model/authStore';
import { setApiAccessToken } from '../../../shared/api/client';
import type { LoginResponse } from '../api/loginApi';

/**
 * 로그인 성공 뒤 처리.
 *
 * 일반 로그인과 테스트 로그인이 토큰 저장·이동을 똑같이 해야 해서 한곳에 모았다.
 * 한쪽만 고쳐 두 경로의 로그인 상태가 달라지는 것을 막는다.
 */
export function useAuthSuccess() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return (response: LoginResponse, rememberMe: boolean) => {
    setAuth(response.accessToken, {
      id: response.userId,
      email: response.email,
      name: response.name,
      role: response.role,
    });

    setApiAccessToken(response.accessToken);

    // 자동 로그인이면 브라우저를 닫아도 남게, 아니면 탭을 닫으면 사라지게 둔다.
    if (rememberMe) {
      localStorage.setItem('refreshToken', response.refreshToken);
      sessionStorage.removeItem('refreshToken');
    } else {
      sessionStorage.setItem('refreshToken', response.refreshToken);
      localStorage.removeItem('refreshToken');
    }

    navigate('/', { replace: true });
  };
}
