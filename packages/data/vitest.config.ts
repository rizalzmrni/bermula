import { defineConfig } from "vitest/config";

// Form & provider berupa komponen React; semua test butuh DOM.
export default defineConfig({
  test: { environment: "happy-dom" },
});
