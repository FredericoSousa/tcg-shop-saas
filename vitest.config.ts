import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    setupFiles: ['./tests/setup.ts'],
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/lib/application/**/*.ts',
        'src/lib/domain/**/*.ts',
        'src/lib/infrastructure/**/*.ts',
        'src/lib/proxy/**/*.ts',
        'src/lib/security/**/*.ts',
        'src/lib/supabase/user-metadata.ts',
        'src/lib/rate-limiter.ts',
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.test.ts',
        '**/index.ts',
        'src/lib/infrastructure/openapi/**',
      ],
      // Baseline pinned slightly below current coverage so PRs that
      // regress the floor fail CI. Bump after each test-adding PR;
      // never lower without a justification in the PR description.
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
});
