import { useAuthStore } from './authStore';

export function useHasEditorAccess(): boolean {
  return useAuthStore((state) => {
    const role = state.user?.role;
    return role === 'editor' || role === 'admin';
  });
}

export function useIsAdmin(): boolean {
  return useAuthStore((state) => state.user?.role === 'admin');
}
