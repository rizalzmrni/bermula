import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import remix from "ultracite/oxlint/remix";
import vitest from "ultracite/oxlint/vitest";

export default defineConfig({
  env: core.env,
  extends: [core, react, remix, vitest],
  ignorePatterns: core.ignorePatterns,
  overrides: [
    {
      // Satu-satunya tempat yang boleh menulis ke console; kode lain wajib
      // memakai logger agar log terstruktur dan ikut terkirim ke BetterStack.
      files: [
        "packages/observability/src/logger.ts",
        "packages/observability/src/logger.test.ts",
      ],
      rules: { "no-console": "off" },
    },
  ],
  // Ultracite mematikan aturan ini; CLAUDE.md mewajibkan logger.
  rules: { "no-console": "error" },
});
