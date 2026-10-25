import { useMemo } from "react";
import { encode } from "uqr";

/** Jalur SVG untuk semua modul gelap; satu `<path>` jauh lebih ringan dari ribuan `<rect>`. */
export const getQrPath = (modules: readonly (readonly boolean[])[]) => {
  const segments: string[] = [];
  for (const [y, row] of modules.entries()) {
    for (const [x, dark] of row.entries()) {
      if (dark) {
        segments.push(`M${x} ${y}h1v1h-1z`);
      }
    }
  }
  return segments.join("");
};

/**
 * Dokumen SVG QR code sebagai data URI. Warna ditulis langsung (bukan token)
 * karena ini gambar, bukan UI — lihat pengecualian di DESIGN.md.
 */
export const getQrDataUri = (value: string) => {
  // `ecc: "M"` cukup untuk layar; `border` 4 = zona tenang standar QR.
  const { data, size } = encode(value, { border: 4, ecc: "M" });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path fill="#000" d="${getQrPath(data)}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

interface QrCodeProps {
  value: string;
  /** Teks alternatif untuk pembaca layar. */
  label: string;
}

/**
 * QR code yang dibuat di browser/Worker dari `value` (tanpa layanan pihak
 * ketiga, karena isinya rahasia TOTP).
 *
 * Pengecualian aturan token (DESIGN.md): selalu hitam di atas putih, termasuk
 * di mode gelap, karena tidak semua pemindai bisa membaca QR terbalik.
 */
export const QrCode = ({ value, label }: QrCodeProps) => {
  const src = useMemo(() => getQrDataUri(value), [value]);

  return (
    <img
      alt={label}
      className="size-48 rounded-lg"
      height={192}
      src={src}
      width={192}
    />
  );
};
