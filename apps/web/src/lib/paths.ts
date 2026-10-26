/** Path halaman situs; satu sumber untuk route, navigasi, dan sitemap. */
export const PATHS = {
  cookieSettings: "/cookie",
  home: "/",
  pricing: "/harga",
  privacy: "/privasi",
  terms: "/syarat",
} as const;

/** Path halaman di apps/app yang ditautkan dari situs ini. */
export const APP_PATHS = {
  signIn: "/sign-in",
  signUp: "/sign-up",
} as const;
