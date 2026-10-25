/**
 * Klien email tidak mendukung CSS variable maupun `oklch`, jadi token
 * `packages/design-system` (lihat DESIGN.md) dikonversi ke hex di sini.
 * Hanya mode terang: dukungan dark mode di klien email tidak konsisten.
 * Perbarui bila nilai token di `globals.css` berubah.
 */
export const EMAIL_COLORS = {
  /** Token `muted`, agar kartu `card` menonjol dari latar email. */
  background: "#ededed",
  border: "#dfdfdf",
  card: "#fcfcfc",
  cardForeground: "#171717",
  mutedForeground: "#202020",
  primary: "#72e3ad",
  primaryForeground: "#1e2723",
} as const;

export const EMAIL_FONT_FAMILY =
  "Outfit, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** `--radius` (0.5rem) dalam piksel; klien email tidak mendukung `rem` dengan andal. */
export const EMAIL_RADIUS = "8px";
