import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

// Test berjalan di workerd, runtime yang sama dengan apps/api, sehingga
// ketidakcocokan React Email/Resend dengan Workers tertangkap di sini.
// Bundling esbuild milik `wrangler deploy` tetap tidak tercakup (lihat README).
export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } })],
  // `fetch` palsu (vi.stubGlobal) dipulihkan otomatis setelah tiap test.
  test: { unstubGlobals: true },
});
