import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const reuseExistingServer =
  process.env.PLAYWRIGHT_REUSE_SERVER === "true" && !process.env.CI;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    screenshot: "off",
    trace: "on-first-retry",
  },
  webServer: process.env.PLAYWRIGHT_NO_WEB_SERVER
    ? undefined
    : {
        command: `pnpm exec next dev --turbopack --port ${PORT} --hostname 127.0.0.1`,
        url: baseURL,
        reuseExistingServer,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
