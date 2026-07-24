import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// 토큰 조회 함수를 상위 레이어에서 주입한다 (shared 는 authStore 를 직접 참조하지 않음 = FSD 경계 준수).
let accessTokenProvider: () => string | null = () => null;

export function setAccessTokenProvider(provider: () => string | null): void {
  accessTokenProvider = provider;
}

// 인증이 필요한 요청에 accessToken 을 자동으로 붙인다.
// 토큰이 없으면(비로그인) 헤더를 생략해 공개 API 는 그대로 동작한다.
apiClient.interceptors.request.use((config) => {
  const accessToken = accessTokenProvider();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
