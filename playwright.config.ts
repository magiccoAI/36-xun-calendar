import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  workers: 1, // 强制单线程执行以避免本地端口和浏览器冲突
  retries: 1, // 增加失败重试
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  }
});
