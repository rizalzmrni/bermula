import { hc } from "hono/client";

import type { AppType } from "./index";

// Pola panduan RPC Hono: tipe klien dihitung sekali saat `build:types`
// (`tsc` dengan konfigurasi & binding api sendiri), lalu konsumen membaca
// `.d.ts` hasilnya. Konsumen tidak meng-infer ulang seluruh source api dengan
// global (`Env`) dan lib (DOM) miliknya sendiri.
const client = hc<AppType>("");

export type Client = typeof client;

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<AppType>(...args);
