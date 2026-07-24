import { create } from 'zustand';

export interface User {
  id: number;
  email: string;
  name: string;
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