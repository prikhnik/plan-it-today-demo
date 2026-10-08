// @ts-check
import { defineConfig, devices } from '@playwright/test';

const PORT = 4300;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}/`,
    ...devices['Pixel 5'],
    viewport: { width: 360, height: 740 },
    colorScheme: 'light',
    locale: 'uk-UA',
  },
  // `vite preview` sends the same headers (CSP) as Vercel, see vite.config.js.
  webServer: {
    command: `corepack pnpm exec vite build && corepack pnpm exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
