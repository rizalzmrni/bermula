import { describe, expect, it } from "vitest";

import { UPLOAD_REJECTION, validateUpload } from "./upload-policy";

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
