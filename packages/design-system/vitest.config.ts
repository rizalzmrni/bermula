import { defineConfig } from "vitest/config";

// Paket UI: semua test butuh DOM (komponen React, matchMedia, localStorage).
export default defineConfig({
  test: { environment: "happy-dom" },
});
