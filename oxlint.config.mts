import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import remix from "ultracite/oxlint/remix";
import vitest from "ultracite/oxlint/vitest";

export default defineConfig({
  env: core.env,
  extends: [core, react, remix, vitest],
  ignorePatterns: [
    ...core.ignorePatterns,
    // Komponen shadcn hasil CLI (gaya `function`, pola ARIA bawaan); tidak
    // diubah manual agar `shadcn add --overwrite` tetap bisa memperbarui.
    "packages/design-system/src/components/ui/**",
  ],
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
    {
      // Urutan properti tabel Drizzle = urutan kolom di Postgres. Kolom
      // disusun menurut prioritas (id → data → relasi → timestamp) agar mudah
      // dibaca di Neon/Drizzle Studio, bukan menurut abjad.
      files: ["packages/db/src/schema/**"],
      rules: { "sort-keys": "off" },
    },
  ],
  // Ultracite mematikan aturan ini; CLAUDE.md mewajibkan logger.
  rules: { "no-console": "error" },
});
