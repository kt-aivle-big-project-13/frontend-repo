import axios from 'axios';

let accessToken: string | null = null;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// 백엔드 GlobalExceptionHandler가 내려주는 공통 에러 응답 형태 (ErrorResponse).
interface ApiErrorResponse {
  code?: string;
  message?: string;
}

// axios 에러에서 백엔드가 내려준 실제 에러 메시지(ErrorResponse.message)를 꺼낸다.
// error.message는 axios가 만든 제네릭 문구("Request failed with status code 500")라
// 그대로 쓰면 사용자에게 원인이 전달되지 않는다 — 반드시 이 함수를 거쳐야 한다.
export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorResponse>(error) && error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function setApiAccessToken(nextAccessToken: string | null) {
  accessToken = nextAccessToken;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});