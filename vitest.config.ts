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
        // Type-only modules: nothing to execute, so they otherwise show
        // as 0% and pull the threshold down for no real reason.
        'src/lib/domain/entities/customer.ts',
        'src/lib/domain/entities/customer-credit-ledger.ts',
        'src/lib/domain/entities/inventory.ts',
        'src/lib/domain/entities/product.ts',
        'src/lib/domain/entities/report.ts',
        'src/lib/domain/entities/tenant.ts',
        'src/lib/domain/events/event-payloads.ts',
        'src/lib/domain/repositories/audit-log.repository.ts',
        'src/lib/domain/repositories/buylist.repository.ts',
        'src/lib/domain/repositories/customer.repository.ts',
        'src/lib/domain/repositories/customer-credit-ledger.repository.ts',
        'src/lib/domain/repositories/inventory.repository.ts',
        'src/lib/domain/repositories/order.repository.ts',
        'src/lib/domain/repositories/outbox.repository.ts',
        'src/lib/domain/repositories/product.repository.ts',
        'src/lib/domain/repositories/report.repository.ts',
        'src/lib/domain/repositories/tenant.repository.ts',
      ],
      // Baseline pinned slightly below current coverage so PRs that
      // regress the floor fail CI. Bump after each test-adding PR;
      // never lower without a justification in the PR description.
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 78,
        statements: 90,
      },
    },
  },
});
