/**
 * URL absolut dari origin situs (`VITE_WEB_URL`, divalidasi tanpa garis miring
 * di akhir) dan path internal. Ditulis tanpa `URL` agar paket tetap murni (tanpa
 * lib DOM/Workers), dan `/` di akhir path dibuang supaya canonical satu bentuk.
 */
export const absoluteUrl = (siteUrl: string, path = "/") => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withoutTrailingSlash =
    normalized.length > 1 ? normalized.replace(/\/+$/u, "") : normalized;
  return withoutTrailingSlash === "/"
    ? siteUrl
    : `${siteUrl}${withoutTrailingSlash}`;
};
