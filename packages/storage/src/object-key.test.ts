import { describe, expect, it } from "vitest";

import {
  createObjectKey,
  isObjectKeyOwnedBy,
  sanitizeFileName,
} from "./object-key";

const ORGANIZATION_ID = "8d3c1f0e-5b7a-4c2e-9f10-2a4b6c8d0e1f";
const OBJECT_ID = "0b6f3a2c-1d4e-4f5a-8b9c-7d6e5f4a3b2c";

describe(sanitizeFileName, () => {
  it("lowercases and replaces unsafe characters", () => {
    expect(sanitizeFileName("Laporan Keuangan (Final) 2026.PDF")).toBe(
      "laporan-keuangan-final-2026.pdf"
    );
  });

  it("strips diacritics", () => {
    expect(sanitizeFileName("Résumé Ñandú.png")).toBe("resume-nandu.png");
  });

  it("drops directory parts so keys cannot escape their prefix", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName(String.raw`C:\Users\budi\foto.jpg`)).toBe(
      "foto.jpg"
    );
  });

  it("falls back to a placeholder when nothing safe remains", () => {
    expect(sanitizeFileName("…")).toBe("file");
    expect(sanitizeFileName("../")).toBe("file");
  });

  it("keeps the extension when truncating long names", () => {
    const result = sanitizeFileName(`${"a".repeat(300)}.pdf`);

    expect(result).toHaveLength(100);
    expect(result.endsWith(".pdf")).toBeTruthy();
  });
});

describe(createObjectKey, () => {
  it("builds <category>/<organization>/<id>-<safe-name>", () => {
    expect(
      createObjectKey({
        category: "images",
        fileName: "Foto Profil.JPG",
        id: OBJECT_ID,
        organizationId: ORGANIZATION_ID,
      })
    ).toBe(`images/${ORGANIZATION_ID}/${OBJECT_ID}-foto-profil.jpg`);
  });

  it("rejects scopes that could change the prefix", () => {
    const base = { category: "images", fileName: "a.txt" };

    expect(() =>
      createObjectKey({ ...base, organizationId: "../other" })
    ).toThrow(/organizationId/u);
    expect(() => createObjectKey({ ...base, organizationId: "" })).toThrow(
      /organizationId/u
    );
    expect(() =>
      createObjectKey({
        ...base,
        category: "images/../documents",
        organizationId: ORGANIZATION_ID,
      })
    ).toThrow(/category/u);
  });
});

describe(isObjectKeyOwnedBy, () => {
  const scope = { category: "documents", organizationId: ORGANIZATION_ID };
  const key = createObjectKey({ ...scope, fileName: "a.txt", id: OBJECT_ID });

  it("accepts keys directly under the category and organization prefix", () => {
    expect(isObjectKeyOwnedBy({ ...scope, key })).toBeTruthy();
  });

  it("rejects keys of another organization, category, or nested paths", () => {
    expect(
      isObjectKeyOwnedBy({ ...scope, key, organizationId: "another-org" })
    ).toBeFalsy();
    expect(
      isObjectKeyOwnedBy({ ...scope, category: "images", key })
    ).toBeFalsy();
    expect(
      isObjectKeyOwnedBy({
        ...scope,
        key: `documents/${ORGANIZATION_ID}/nested/a.txt`,
      })
    ).toBeFalsy();
    expect(
      isObjectKeyOwnedBy({ ...scope, key: `documents/${ORGANIZATION_ID}/` })
    ).toBeFalsy();
  });
});
