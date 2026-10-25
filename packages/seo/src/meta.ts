import { APP_NAME } from "@bermula/core/brand";

import { absoluteUrl } from "./url";

/**
 * Bentuknya cocok dengan `MetaDescriptor` React Router (`export const meta`),
 * tanpa membuat paket ini bergantung pada framework.
 */
export type MetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string }
  | { tagName: "link"; rel: string; href: string };

export interface PageMetaInput {
  /** Origin situs, mis. `VITE_WEB_URL`. */
  siteUrl: string;
  /** Path halaman, untuk canonical & `og:url`. */
  path: string;
  /** Judul halaman tanpa nama brand; `undefined` untuk beranda. */
  title?: string;
  description: string;
  /** URL absolut gambar pratinjau (1200×630). */
  image?: string;
  /** `website` (default) atau `article` untuk konten bertanggal. */
  type?: "website" | "article";
  /** Halaman yang tidak boleh diindeks (mis. hasil pencarian internal). */
  noIndex?: boolean;
}

const TITLE_SEPARATOR = " — ";
const OG_LOCALE = "id_ID";

export const pageTitle = (title?: string) =>
  title ? `${title}${TITLE_SEPARATOR}${APP_NAME}` : APP_NAME;

/**
 * Metadata standar satu halaman: title, description, canonical, Open Graph,
 * dan Twitter card. Dipakai di setiap `meta` export apps/web.
 */
export const buildPageMeta = ({
  description,
  image,
  noIndex = false,
  path,
  siteUrl,
  title,
  type = "website",
}: PageMetaInput): MetaTag[] => {
  const fullTitle = pageTitle(title);
  const url = absoluteUrl(siteUrl, path);

  const tags: MetaTag[] = [
    { title: fullTitle },
    { content: description, name: "description" },
    { href: url, rel: "canonical", tagName: "link" },
    { content: fullTitle, property: "og:title" },
    { content: description, property: "og:description" },
    { content: url, property: "og:url" },
    { content: type, property: "og:type" },
    { content: APP_NAME, property: "og:site_name" },
    { content: OG_LOCALE, property: "og:locale" },
    {
      content: image ? "summary_large_image" : "summary",
      name: "twitter:card",
    },
    { content: fullTitle, name: "twitter:title" },
    { content: description, name: "twitter:description" },
  ];

  if (image) {
    tags.push(
      { content: image, property: "og:image" },
      { content: image, name: "twitter:image" }
    );
  }
  if (noIndex) {
    tags.push({ content: "noindex, nofollow", name: "robots" });
  }
  return tags;
};
