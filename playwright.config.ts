import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    {
      name: 'phone-360x640',
      use: { viewport: { width: 360, height: 640 } },
    },
    {
      name: 'phone-390x844',
      use: { viewport: { width: 390, height: 844 } },
    },
    {
      name: 'phone-430x932',
      use: { viewport: { width: 430, height: 932 } },
    },
    {
      name: 'ipad-portrait-768x1024',
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'ipad-landscape-1024x768',
      use: { viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'tablet-820x1180',
      use: { viewport: { width: 820, height: 1180 } },
    },
    {
      name: 'desktop-1280x800',
      use: { viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'desktop-1440x900',
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'desktop-1920x1080',
      use: { viewport: { width: 1920, height: 1080 } },
    },
  ],
});
