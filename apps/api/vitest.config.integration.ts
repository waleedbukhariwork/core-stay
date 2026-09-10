import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
export default defineConfig({ plugins: [tsconfigPaths()], test: {
  root: './', include: ['test/**/*.integration-spec.ts'], setupFiles: ['./test/setup.ts'],
  testTimeout: 20_000, hookTimeout: 30_000, fileParallelism: false,
} });
