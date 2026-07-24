import { apiClient } from '../../../shared/api/client';

export interface MyProfileResponse {
  userId: number;
  email: string;
  name: string;
  password: string;
  role: string;
  institution: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UpdateProfileRequest {
  name: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export async function fetchMyProfile(): Promise<MyProfileResponse> {
  const { data } = await apiClient.get<MyProfileResponse>('/users/me');
  return data;
}

export async function updateMyProfile(
  request: UpdateProfileRequest,
): Promise<MyProfileResponse> {
  const { data } = await apiClient.patch<MyProfileResponse>('/users/me', request);
  return data;
}

export async function changeMyPassword(
  request: ChangePasswordRequest,
): Promise<ChangePasswordResponse> {
  const { data } = await apiClient.patch<ChangePasswordResponse>(
    '/users/me/password',
    request,
  );
  return data;
}

export interface VerifyPasswordRequest {
  currentPassword: string;
}

export interface VerifyPasswordResponse {
  message: string;
}

export async function verifyCurrentPassword(
  request: VerifyPasswordRequest,
): Promise<VerifyPasswordResponse> {
  const { data } = await apiClient.post<VerifyPasswordResponse>(
    '/users/me/password/verify',
    request,
  );
  return data;
}