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
  lawEmailEnabled: boolean;
  reauditAlertEnabled: boolean;
  auditCompleteAlertEnabled: boolean;
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

export interface UpdateNotificationPreferencesRequest {
  lawEmailEnabled: boolean;
  reauditAlertEnabled: boolean;
  auditCompleteAlertEnabled: boolean;
}

export async function updateNotificationPreferences(
  request: UpdateNotificationPreferencesRequest,
): Promise<MyProfileResponse> {
  const { data } = await apiClient.patch<MyProfileResponse>(
    '/users/me/notifications',
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

export interface WithdrawRequest {
  password: string;
}

export interface WithdrawResponse {
  message: string;
}

// 회원 탈퇴. 성공 시 서버가 현재 세션(액세스 토큰 블랙리스트 + 리프레시 토큰)을
// 이미 무효화하므로, 별도로 로그아웃 API를 호출할 필요는 없다.
export async function withdraw(
  request: WithdrawRequest,
): Promise<WithdrawResponse> {
  const { data } = await apiClient.delete<WithdrawResponse>('/users/me', {
    data: request,
  });
  return data;
}