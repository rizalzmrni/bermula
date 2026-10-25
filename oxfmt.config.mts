import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  // Skill pihak ketiga diverifikasi lewat hash di skills-lock.json; jangan diformat ulang.
  ignorePatterns: [
    ...ultracite.ignorePatterns,
    ".agents/skills",
    ".claude/skills",
    // Hasil drizzle-kit; dibiarkan persis seperti yang ditulis generator.
    "packages/db/migrations",
  ],
  // Dokumen Markdown sengaja di-wrap ±80 kolom agar diff-nya mudah dibaca.
  proseWrap: "preserve",
});
