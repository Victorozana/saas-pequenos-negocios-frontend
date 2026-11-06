import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 120_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: process.env.E2E_FRONTEND_URL ?? "http://localhost:3075",
    trace: "off",
  },
});
