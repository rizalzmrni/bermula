import { absoluteUrl } from "./url";

export const CHANGE_FREQUENCY = {
  daily: "daily",
  monthly: "monthly",
  weekly: "weekly",
  yearly: "yearly",
} as const;

export type ChangeFrequency =
  (typeof CHANGE_FREQUENCY)[keyof typeof CHANGE_FREQUENCY];

export interface SitemapEntry {
  path: string;
  lastModified?: Date;
  changeFrequency?: ChangeFrequency;
  /** 0.0–1.0, relatif terhadap halaman lain di situs ini. */
  priority?: number;
}

const XML_ESCAPES: Record<string, string> = {
  '"': "&quot;",
  "&": "&amp;",
  "'": "&apos;",
  "<": "&lt;",
  ">": "&gt;",
};
const XML_SPECIAL = /["&'<>]/gu;

const escapeXml = (value: string) =>
  value.replaceAll(XML_SPECIAL, (char) => XML_ESCAPES[char] ?? char);

const toDate = (date: Date) => date.toISOString().slice(0, "YYYY-MM-DD".length);

const toUrlElement = (siteUrl: string, entry: SitemapEntry) => {
  const children = [
    `<loc>${escapeXml(absoluteUrl(siteUrl, entry.path))}</loc>`,
    entry.lastModified
      ? `<lastmod>${toDate(entry.lastModified)}</lastmod>`
      : "",
    entry.changeFrequency
      ? `<changefreq>${entry.changeFrequency}</changefreq>`
      : "",
    entry.priority === undefined
      ? ""
      : `<priority>${entry.priority.toFixed(1)}</priority>`,
  ].filter(Boolean);
  return `<url>${children.join("")}</url>`;
};

/** Isi `sitemap.xml` (protokol sitemaps.org 0.9). */
export const buildSitemap = ({
  entries,
  siteUrl,
}: {
  entries: readonly SitemapEntry[];
  siteUrl: string;
}) =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) => toUrlElement(siteUrl, entry)),
    "</urlset>",
    "",
  ].join("\n");
