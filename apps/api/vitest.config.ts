import { readFileSync } from "node:fs";
import path from "node:path";

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
  R2_ACCESS_KEY_ID: "test-access-key",
  R2_ACCOUNT_ID: "0123456789abcdef0123456789abcdef",
  R2_BUCKET_NAME: "bermula-test",
  R2_SECRET_ACCESS_KEY: "test-secret-key",
  RESEND_API_KEY: "re_test",
  WEB_URL: "http://localhost:5174",
};

// wrangler tetap memuat `.dev.vars`; nilai uji hanya menimpa variabel wajib.
// Semua variabel di file contoh dikosongkan dulu (`emptyStringAsUndefined` di
// t3-env), agar variabel opsional yang diisi lokal (mis. PostHog, BetterStack,
// Google OAuth) tidak ikut aktif di test.
const EXAMPLE_KEYS =
  readFileSync(
    path.join(import.meta.dirname, ".dev.vars.example"),
    "utf-8"
  ).match(/^[A-Z0-9_]+(?==)/gmu) ?? [];
const BINDINGS = {
  ...Object.fromEntries(EXAMPLE_KEYS.map((key) => [key, ""])),
  ...TEST_BINDINGS,
};

// Test service berbasis DB (`*.db.test.ts`) berjalan di Node dengan PGlite
// (`@bermula/db/testing`), karena Postgres WASM tidak dimuat di workerd.
// Sisanya berjalan di workerd dengan binding uji.
const DB_TESTS = "src/**/*.db.test.ts";

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [
          cloudflareTest({
            miniflare: { bindings: BINDINGS },
            wrangler: { configPath: "./wrangler.jsonc" },
          }),
        ],
        test: {
          exclude: [DB_TESTS],
          include: ["src/**/*.test.ts"],
          name: "worker",
        },
      },
      {
        test: {
          environment: "node",
          // Membuat PGlite + menerapkan migrasi butuh beberapa detik.
          hookTimeout: 30_000,
          include: [DB_TESTS],
          name: "db",
        },
      },
    ],
  },
});
