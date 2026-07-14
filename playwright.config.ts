import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: process.env.APP_URL ?? 'http://localhost:8000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'php artisan serve',
    url: 'http://localhost:8000',
    reuseExistingServer: true,
  },
})
