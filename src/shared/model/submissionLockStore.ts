import { create } from 'zustand';

interface SubmissionLockState {
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
}

// 여러 단계의 API 호출로 이어지는 제출(예: 모델 업로드 → 데이터셋 업로드 → 감사 시작)이
// 진행되는 동안, 로그아웃처럼 인증 토큰을 무효화하는 동작을 막기 위한 전역 잠금.
// 제출 도중 로그아웃하면 그 뒤에 나가는 요청이 401로 실패해, 앞 단계만 반영된 상태
// (예: 모델은 생성됐는데 감사는 생성되지 않음)가 남을 수 있다.
export const useSubmissionLockStore = create<SubmissionLockState>((set) => ({
  isLocked: false,
  lock: () => set({ isLocked: true }),
  unlock: () => set({ isLocked: false }),
}));