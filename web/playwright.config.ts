import { defineConfig, devices } from '@playwright/test'

// Автотесты главного на демо-сборке (без сервера): `npm test`.
// Перед тестами собирается dist-demo и поднимается локальный сервер.
export default defineConfig({
  testDir: 'tests',
  timeout: 45_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    ...devices['iPhone 13'],
    browserName: 'chromium',
    baseURL: 'http://localhost:4179/',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  webServer: {
    command: 'npm run build:demo && npx vite preview --outDir dist-demo --port 4179 --strictPort',
    url: 'http://localhost:4179/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
