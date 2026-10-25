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

export const TWO_FACTOR_PATH = "/sign-in/two-factor";

/**
 * URL langkah kedua login, membawa tujuan akhir (sudah disaring) dan
 * cara verifikasi opsional (`?method=`).
 */
export const getTwoFactorUrl = ({
  redirectTo,
  method,
}: {
  redirectTo: FormDataEntryValue | string | null;
  method?: string;
}) => {
  const target = getSafeRedirect(redirectTo);
  const params = new URLSearchParams();
  if (target !== DEFAULT_REDIRECT) {
    params.set("redirectTo", target);
  }
  if (method) {
    params.set("method", method);
  }
  const query = params.toString();
  return query ? `${TWO_FACTOR_PATH}?${query}` : TWO_FACTOR_PATH;
};

/** URL halaman login yang membawa path saat ini sebagai `redirectTo`. */
export const getLoginUrl = (request: Request) => {
  const { pathname, search } = new URL(request.url);
  const target = `${pathname}${search}`;
  return target === DEFAULT_REDIRECT
    ? "/sign-in"
    : `/sign-in?${new URLSearchParams({ redirectTo: target })}`;
};

/** Pesan satu kali di halaman login, dipilih lewat `?notice=`. */
export const SIGN_IN_NOTICE = {
  passwordReset: "password-reset",
} as const;

export const RESET_PASSWORD_SUCCESS_URL = `/sign-in?notice=${SIGN_IN_NOTICE.passwordReset}`;
