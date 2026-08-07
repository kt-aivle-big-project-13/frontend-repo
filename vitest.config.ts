import path from 'node:path';

import { defineConfig } from 'vitest/config';

// 이번 스코프는 DOM 없는 순수 로직(감사 결과 유틸)만 다뤄 environment는 node로 둔다.
// 컴포넌트 테스트를 추가하게 되면 jsdom + @testing-library/react 설정이 별도로 필요하다.
export default defineConfig({
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src/app'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@widgets': path.resolve(__dirname, 'src/widgets'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
