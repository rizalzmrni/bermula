import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// Nilai palsu yang lolos validasi env; menimpa `.dev.vars` agar test tidak
// pernah memakai secret lokal atau menyentuh database/layanan nyata.
const TEST_BINDINGS = {
  API_DOCS_ENABLED: "true",
  APP_URL: "http://localhost:5173",
  BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-chars",
  BETTER_AUTH_URL: "http://localhost:8787",
  CORS_ORIGINS: "http://localhost:5173,http://localhost:5174",
  DATABASE_URL: "postgresql://test:test@db.invalid/test",
  EMAIL_FROM: "Bermula <noreply@example.com>",
  LOG_LEVEL: "error",
  RESEND_API_KEY: "re_test",
  WEB_URL: "http://localhost:5174",
};

export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: { bindings: TEST_BINDINGS },
      wrangler: { configPath: "./wrangler.jsonc" },
    }),
  ],
});
