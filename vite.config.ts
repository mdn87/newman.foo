import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    manifest: true,
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
