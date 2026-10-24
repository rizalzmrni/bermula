import type * as MainModule from "./index";

// `wrangler types` belum mengisi `mainModule`; tanpa ini `exports.default`
// dari `cloudflare:workers` (dipakai test) tidak bertipe.
declare global {
  namespace Cloudflare {
    interface GlobalProps {
      mainModule: typeof MainModule;
    }
  }
}
