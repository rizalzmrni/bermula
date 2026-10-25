import { describe, expect, it } from "vitest";

import { formatBackupCodesFile } from "./backup-codes";
import { getQrDataUri, getQrPath } from "./qr-code";
import { formatTotpSecret } from "./two-factor-section";

describe(getQrPath, () => {
  it("draws one unit square per dark module", () => {
    const modules = [
      [true, false],
      [false, true],
    ];
    expect(getQrPath(modules)).toBe("M0 0h1v1h-1zM1 1h1v1h-1z");
  });

  it("returns an empty path when there is no dark module", () => {
    expect(getQrPath([[false]])).toBe("");
  });
});

describe(getQrDataUri, () => {
  it("encodes a white-background SVG with a quiet zone", () => {
    const uri = getQrDataUri("otpauth://totp/Bermula:budi?secret=ABC");
    const svg = decodeURIComponent(uri.replace("data:image/svg+xml,", ""));

    expect(uri.startsWith("data:image/svg+xml,")).toBeTruthy();
    // Versi 1 (21 modul) + border 4 di setiap sisi = 29 ke atas.
    expect(svg).toMatch(/viewBox="0 0 (?:29|3\d|[4-9]\d|1\d\d) /u);
    expect(svg).toContain('fill="#fff"');
    expect(svg).toContain('fill="#000"');
  });
});

describe(formatTotpSecret, () => {
  it("groups the key by four characters", () => {
    expect(formatTotpSecret("JBSWY3DPEHPK3PXP")).toBe("JBSW Y3DP EHPK 3PXP");
    expect(formatTotpSecret("ABCDEF")).toBe("ABCD EF");
  });
});

describe(formatBackupCodesFile, () => {
  it("lists one code per line after the explanation", () => {
    const lines = formatBackupCodesFile(["aaaa-bbbb", "cccc-dddd"]).split("\n");

    expect(lines.slice(-3)).toStrictEqual(["aaaa-bbbb", "cccc-dddd", ""]);
    expect(lines[0]).toContain("Kode cadangan");
  });
});
