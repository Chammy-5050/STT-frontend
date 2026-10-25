import { defineConfig } from "@playwright/test";

// Override when the dev server runs elsewhere, e.g. E2E_BASE_URL=http://localhost:3001 PW_CHANNEL=chrome.
export const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  use: {
    baseURL,
    browserName: "chromium",
    channel: process.env.PW_CHANNEL ?? "msedge",
    headless: true,
    trace: "retain-on-failure",
  },
});
