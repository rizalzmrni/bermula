import { describe, expect, it } from "vitest";

import {
  UPLOAD_POLICIES,
  UPLOAD_REJECTION,
  uploadRequestSchema,
  validateUpload,
} from "./files";

const IMAGE_POLICY = {
  allowedContentTypes: ["image/*", "application/pdf"],
  maxSize: 5 * 1024 * 1024,
} as const;

describe(validateUpload, () => {
  it("accepts allowed types within the size limit", () => {
    expect(
      validateUpload({ contentType: "image/png", size: 1024 }, IMAGE_POLICY)
    ).toStrictEqual({ ok: true });
    expect(
      validateUpload(
        { contentType: "Application/PDF; charset=binary", size: 1024 },
        IMAGE_POLICY
      )
    ).toStrictEqual({ ok: true });
  });

  it("rejects types outside the allow-list", () => {
    expect(
      validateUpload({ contentType: "text/html", size: 1024 }, IMAGE_POLICY)
    ).toStrictEqual({ ok: false, reason: UPLOAD_REJECTION.unsupportedType });
    expect(
      validateUpload({ contentType: "imagex/png", size: 1024 }, IMAGE_POLICY)
    ).toStrictEqual({ ok: false, reason: UPLOAD_REJECTION.unsupportedType });
  });

  it("rejects files above the size limit", () => {
    expect(
      validateUpload(
        { contentType: "image/png", size: IMAGE_POLICY.maxSize + 1 },
        IMAGE_POLICY
      )
    ).toStrictEqual({ ok: false, reason: UPLOAD_REJECTION.fileTooLarge });
  });

  it("rejects empty or invalid sizes", () => {
    for (const size of [0, -1, 1.5, Number.NaN]) {
      expect(
        validateUpload({ contentType: "image/png", size }, IMAGE_POLICY)
      ).toStrictEqual({ ok: false, reason: UPLOAD_REJECTION.emptyFile });
    }
  });
});

describe("upload policies per file kind", () => {
  it("keeps images and documents apart", () => {
    const pdf = { contentType: "application/pdf", size: 1024 };
    const png = { contentType: "image/png", size: 1024 };

    expect(validateUpload(png, UPLOAD_POLICIES.image).ok).toBeTruthy();
    expect(validateUpload(pdf, UPLOAD_POLICIES.image).ok).toBeFalsy();
    expect(validateUpload(pdf, UPLOAD_POLICIES.document).ok).toBeTruthy();
    expect(validateUpload(png, UPLOAD_POLICIES.document).ok).toBeFalsy();
  });

  it("rejects SVG images because they can carry scripts", () => {
    expect(
      validateUpload(
        { contentType: "image/svg+xml", size: 1024 },
        UPLOAD_POLICIES.image
      )
    ).toStrictEqual({ ok: false, reason: UPLOAD_REJECTION.unsupportedType });
  });
});

describe("upload request schema", () => {
  it("trims names and rejects empty or fractional input", () => {
    expect(
      uploadRequestSchema.parse({
        contentType: "image/png",
        fileName: "  foto.png ",
        size: 10,
      })
    ).toStrictEqual({
      contentType: "image/png",
      fileName: "foto.png",
      size: 10,
    });
    expect(
      uploadRequestSchema.safeParse({
        contentType: "image/png",
        fileName: "   ",
        size: 10,
      }).success
    ).toBeFalsy();
    expect(
      uploadRequestSchema.safeParse({
        contentType: "image/png",
        fileName: "a.png",
        size: 1.5,
      }).success
    ).toBeFalsy();
  });
});
