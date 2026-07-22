import { apiClient } from '../../../shared/api/client';

export interface SendVerificationCodeRequest {
  email: string;
}

export interface SendVerificationCodeResponse {
  message: string;
}

export interface ConfirmVerificationCodeRequest {
  email: string;
  code: string;
}

export interface ConfirmVerificationCodeResponse {
  message: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  message: string;
}

export async function sendVerificationCode({
  email,
}: SendVerificationCodeRequest): Promise<SendVerificationCodeResponse> {
  const { data } = await apiClient.post<SendVerificationCodeResponse>(
    '/auth/email/verification-code',
    { email },
  );

  return data;
}

export async function confirmVerificationCode({
  email,
  code,
}: ConfirmVerificationCodeRequest): Promise<ConfirmVerificationCodeResponse> {
  const { data } = await apiClient.post<ConfirmVerificationCodeResponse>(
    '/auth/email/verification-code/confirm',
    { email, code },
  );

  return data;
}

export async function signup({
  name,
  email,
  password,
}: SignupRequest): Promise<SignupResponse> {
  const { data } = await apiClient.post<SignupResponse>('/auth/signup', {
    name,
    email,
    password,
  });

  return data;
}
