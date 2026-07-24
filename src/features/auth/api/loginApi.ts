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