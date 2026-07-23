import axios from 'axios';
import { apiClient } from '../../../shared/api/client';

// 이메일 인증번호 발송 요청
export interface SendVerificationCodeRequest {
  email: string;
}

// 이메일 인증번호 발송 응답
export interface SendVerificationCodeResponse {
  message: string;
}

// 이메일 인증번호 확인 요청
export interface ConfirmVerificationCodeRequest {
  email: string;
  code: string;
}

// 이메일 인증번호 확인 응답
export interface ConfirmVerificationCodeResponse {
  message: string;
}

// 회원가입 요청
export interface SignupRequest {
  name: string;
  institution: string;
  email: string;
  password: string;
  passwordConfirm: string;
  serviceTermsAgreed: boolean;
  privacyTermsAgreed: boolean;
}

// 회원가입 응답
export interface SignupResponse {
  message: string;
}

// 백엔드 공통 오류 응답
interface ApiErrorResponse {
  code?: string;
  message?: string;
  status?: number;
}

// Axios 오류 메시지 처리 함수
export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

// 이메일 인증번호 발송
export async function sendVerificationCode({
  email,
}: SendVerificationCodeRequest): Promise<SendVerificationCodeResponse> {
  const { data } = await apiClient.post<SendVerificationCodeResponse>(
    '/auth/email/verification-code',
    { email },
  );

  return data;
}

// 이메일 인증번호 확인
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
  institution,
  email,
  password,
  passwordConfirm,
  serviceTermsAgreed,
  privacyTermsAgreed,
}: SignupRequest): Promise<SignupResponse> {
  const { data } = await apiClient.post<SignupResponse>('/auth/signup', {
    name,
    institution,
    email,
    password,
    passwordConfirm,
    serviceTermsAgreed,
    privacyTermsAgreed,
  });

  return data;
}
