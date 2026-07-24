import { create } from 'zustand';

interface LoginPromptState {
  isVisible: boolean;
  show: () => void;
  hide: () => void;
}

export const useLoginPromptStore = create<LoginPromptState>((set) => ({
  isVisible: false,
  show: () => set({ isVisible: true }),
  hide: () => set({ isVisible: false }),
}));
