import { defineConfig } from "@playwright/test";

const externalBaseUrl = process.env.E2E_BASE_URL;
const baseURL = externalBaseUrl ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  outputDir: "test-results",
  use: {
    baseURL,
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL + "/en",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
