import { apiClient } from '../../../shared/api/client';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
  recaptchaToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  email: string;
  name: string;
  role: string;
}

export async function login({
  email,
  password,
  rememberMe,
  recaptchaToken,
}: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    '/auth/login',
    {
      email,
      password,
      rememberMe,
      recaptchaToken,
    },
  );

  return data;
}

/**
 * 시연용 게스트 계정을 발급받는다.
 *
 * 응답은 일반 로그인과 같은 형식이라 이후 처리를 그대로 공유한다.
 * 백엔드에서 시연 모드가 꺼져 있으면 404가 온다.
 */
export async function demoLogin(): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    '/auth/demo',
  );

  return data;
}

export interface ReissueRequest {
  refreshToken: string;
}

export async function reissue(
  refreshToken: string,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    '/auth/reissue',
    {
      refreshToken,
    },
  );

  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}