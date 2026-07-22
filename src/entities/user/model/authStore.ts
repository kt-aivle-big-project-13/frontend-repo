import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}));

if (import.meta.env.DEV) {
  // 개발 중 백엔드 없이 로그인 상태를 미리보기 위한 콘솔 접근용 (프로덕션 빌드 제외)
  (window as unknown as { authStore: typeof useAuthStore }).authStore =
    useAuthStore;
}
