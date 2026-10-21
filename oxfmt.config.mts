import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  // Skill pihak ketiga diverifikasi lewat hash di skills-lock.json; jangan diformat ulang.
  ignorePatterns: [
    ...ultracite.ignorePatterns,
    ".agents/skills",
    ".claude/skills",
  ],
  // Dokumen Markdown sengaja di-wrap ±80 kolom agar diff-nya mudah dibaca.
  proseWrap: "preserve",
});
