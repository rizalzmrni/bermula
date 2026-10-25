import { getWebClientEnv } from "@bermula/env/web";
import { buildPageMeta } from "@bermula/seo/meta";
import type { PageMetaInput } from "@bermula/seo/meta";
import { absoluteUrl } from "@bermula/seo/url";

export interface SiteConfig {
  /** Origin apps/app, tujuan tautan masuk/daftar. */
  appUrl: string;
  /** Origin situs ini, untuk canonical, Open Graph, dan sitemap. */
  siteUrl: string;
  allowIndexing: boolean;
}

/**
 * Konfigurasi situs dari env klien. Dibaca saat dipanggil (bukan di top-level
 * modul) agar env yang salah gagal dengan pesan t3-env, bukan saat impor.
 */
export const getSiteConfig = (): SiteConfig => {
  const env = getWebClientEnv();
  return {
    allowIndexing: env.VITE_ALLOW_INDEXING,
    appUrl: env.VITE_APP_URL,
    siteUrl: env.VITE_WEB_URL,
  };
};

/** URL absolut ke halaman apps/app, mis. `appLink(APP_PATHS.signUp)`. */
export const appLink = (path: string) =>
  absoluteUrl(getSiteConfig().appUrl, path);

/** `buildPageMeta` dengan origin situs ini; dipakai setiap `meta` export. */
export const pageMeta = (input: Omit<PageMetaInput, "siteUrl">) =>
  buildPageMeta({ ...input, siteUrl: getSiteConfig().siteUrl });
