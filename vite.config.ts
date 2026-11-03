import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    // The default 5 s was too short for the network-layout tests (many random layouts in one test) on a CI machine with two busy cores.
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // A safety net for CI only: a test that fails then passes is retried and shown as flaky rather than turning the build red. Locally nothing is retried.
    retry: process.env.CI ? 2 : 0,
  },
})
