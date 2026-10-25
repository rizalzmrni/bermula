const DEFAULT_REDIRECT = "/";

/**
 * Tujuan redirect setelah login yang aman: hanya path internal. Menolak URL
 * absolut, `//host` (protocol-relative), dan `/\host` yang oleh browser
 * diperlakukan sebagai host lain (open redirect).
 */
export const getSafeRedirect = (target: FormDataEntryValue | string | null) => {
  if (typeof target !== "string" || !target.startsWith("/")) {
    return DEFAULT_REDIRECT;
  }
  if (target.startsWith("//") || target.startsWith("/\\")) {
    return DEFAULT_REDIRECT;
  }
  return target;
};

/** URL halaman login yang membawa path saat ini sebagai `redirectTo`. */
export const getLoginUrl = (request: Request) => {
  const { pathname, search } = new URL(request.url);
  const target = `${pathname}${search}`;
  return target === DEFAULT_REDIRECT
    ? "/masuk"
    : `/masuk?${new URLSearchParams({ redirectTo: target })}`;
};
