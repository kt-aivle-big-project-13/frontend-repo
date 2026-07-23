import type { User } from '../../../entities/user/model/authStore';
import { apiClient } from '../../../shared/api/client';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export async function login({
  email,
  password,
  rememberMe,
}: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', {
    email,
    password,
    rememberMe,
  });

  return data;
}
