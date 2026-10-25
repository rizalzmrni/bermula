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
    // Komponen shadcn; dibiarkan sesuai output CLI agar `shadcn add --overwrite`
    // bisa memperbarui tanpa konflik format.
    "packages/design-system/src/components/ui",
  ],
  // Dokumen Markdown sengaja di-wrap ±80 kolom agar diff-nya mudah dibaca.
  proseWrap: "preserve",
});
