import type { LinkDescriptor } from "react-router";

// Outfit = `--font-sans` di globals.css (lihat DESIGN.md). Dimuat dari Google
// Fonts karena `next/font` (mis. paket `geist`) hanya berjalan di Next.js.
const GOOGLE_FONTS_ORIGIN = "https://fonts.googleapis.com";
const GOOGLE_FONTS_STATIC_ORIGIN = "https://fonts.gstatic.com";
const OUTFIT_STYLESHEET_URL = `${GOOGLE_FONTS_ORIGIN}/css2?family=Outfit:wght@100..900&display=swap`;

/**
 * Gabungkan ke export `links` di `root.tsx` tiap app:
 * `export const links: Route.LinksFunction = () => [...fontLinks];`
 */
export const fontLinks: LinkDescriptor[] = [
  { href: GOOGLE_FONTS_ORIGIN, rel: "preconnect" },
  {
    crossOrigin: "anonymous",
    href: GOOGLE_FONTS_STATIC_ORIGIN,
    rel: "preconnect",
  },
  { href: OUTFIT_STYLESHEET_URL, rel: "stylesheet" },
];

/** Kelas untuk `<body>` di root layout. */
export const fontVariables = "touch-manipulation font-sans antialiased";
