import { create } from 'zustand';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

// 시연용 게스트 계정에 붙는 이메일 도메인. 백엔드 DemoAccountService 가 이 도메인으로 발급한다.
const DEMO_GUEST_EMAIL_DOMAIN = '@demo.invalid';

// 게스트에게는 계정 발급과 함께 데모 모델·데이터셋이 만들어져 있어서, 일반 사용자와 화면을
// 다르게 열어야 하는 곳이 있다.
export function isDemoGuest(user: User | null): boolean {
  return user?.email.endsWith(DEMO_GUEST_EMAIL_DOMAIN) ?? false;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, user: User) => void;
  updateUserName: (name: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  updateUserName: (name) =>
    set((state) => (state.user ? { user: { ...state.user, name } } : state)),
  clearAuth: () => set({ accessToken: null, user: null }),
}));