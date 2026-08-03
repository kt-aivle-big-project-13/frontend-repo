import { apiClient, extractApiErrorMessage } from '../../../shared/api/client';

// 이메일 인증번호 발송 요청
export interface SendVerificationCodeRequest {
  email: string;
}

// 이메일 인증번호 발송 응답
export interface SendVerificationCodeResponse {
  message: string;
  expiresIn: number;
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

// Axios 오류 메시지 처리 함수 (shared/api/client의 공용 구현)
export const getApiErrorMessage = extractApiErrorMessage;

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