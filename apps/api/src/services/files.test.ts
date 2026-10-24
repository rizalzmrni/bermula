import { UPLOAD_REJECTION } from "@bermula/core/files";
import type { StoredFile } from "@bermula/db/schema/storage";
import { describe, expect, it } from "vitest";

import {
  UPLOAD_CHECK,
  canDeleteFile,
  checkUploadedObject,
  createUpload,
  toFileResponse,
} from "./files";
import type { FileScope } from "./files";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

const FILE: StoredFile = {
  contentType: "image/png",
  createdAt: new Date("2026-10-24T13:00:00.000Z"),
  fileName: "Foto.png",
  id: "33333333-3333-4333-8333-333333333333",
  key: "images/org/33333333-foto.png",
  kind: "image",
  organizationId: "44444444-4444-4444-8444-444444444444",
  size: 2048,
  status: "uploaded",
  updatedAt: new Date("2026-10-24T13:01:00.000Z"),
  uploadedAt: new Date("2026-10-24T13:01:00.000Z"),
  uploadedBy: USER_ID,
};

describe(canDeleteFile, () => {
  it("lets the uploader delete their own file", () => {
    expect(
      canDeleteFile({ file: FILE, role: "member", userId: USER_ID })
    ).toBeTruthy();
  });

  it("lets owners and admins delete any file, including multi-role values", () => {
    expect(
      canDeleteFile({ file: FILE, role: "owner", userId: OTHER_USER_ID })
    ).toBeTruthy();
    expect(
      canDeleteFile({
        file: FILE,
        role: "member, admin",
        userId: OTHER_USER_ID,
      })
    ).toBeTruthy();
  });

  it("blocks other members and orphaned files for non-admins", () => {
    expect(
      canDeleteFile({ file: FILE, role: "member", userId: OTHER_USER_ID })
    ).toBeFalsy();
    expect(
      canDeleteFile({
        file: { uploadedBy: null },
        role: "member",
        userId: OTHER_USER_ID,
      })
    ).toBeFalsy();
  });
});

describe(checkUploadedObject, () => {
  const object = {
    contentType: "image/png",
    etag: "abc",
    key: FILE.key,
    size: 2048,
    uploadedAt: new Date(),
  };

  it("matches when size and media type are the same", () => {
    expect(checkUploadedObject(FILE, object)).toBe(UPLOAD_CHECK.matches);
    expect(
      checkUploadedObject(FILE, { ...object, contentType: "IMAGE/PNG; x=1" })
    ).toBe(UPLOAD_CHECK.matches);
  });

  it("reports missing and mismatching objects", () => {
    expect(checkUploadedObject(FILE, null)).toBe(UPLOAD_CHECK.missing);
    expect(checkUploadedObject(FILE, { ...object, size: 1 })).toBe(
      UPLOAD_CHECK.mismatch
    );
    expect(
      checkUploadedObject(FILE, { ...object, contentType: "text/html" })
    ).toBe(UPLOAD_CHECK.mismatch);
  });
});

describe(toFileResponse, () => {
  it("serializes dates and hides the storage key", () => {
    const response = toFileResponse(FILE);

    expect(response).toMatchObject({
      createdAt: "2026-10-24T13:00:00.000Z",
      uploadedAt: "2026-10-24T13:01:00.000Z",
    });
    expect(response).not.toHaveProperty("key");
  });
});

describe(createUpload, () => {
  // Jalur penolakan berhenti sebelum menyentuh DB atau storage; akses apa pun
  // ke keduanya akan melempar error dan menggagalkan test.
  const untouchable = new Proxy(
    {},
    {
      get: () => {
        throw new Error("must not be called");
      },
    }
  );
  const scope = {
    db: untouchable,
    kind: "image",
    organizationId: FILE.organizationId,
    storage: untouchable,
  } as FileScope;

  it("rejects files outside the image policy with a specific code", async () => {
    await expect(
      createUpload({
        input: { contentType: "application/pdf", fileName: "a.pdf", size: 10 },
        scope,
        userId: USER_ID,
      })
    ).rejects.toMatchObject({
      code: UPLOAD_REJECTION.unsupportedType,
      status: 400,
    });
    await expect(
      createUpload({
        input: {
          contentType: "image/png",
          fileName: "a.png",
          size: 50 * 1024 * 1024,
        },
        scope,
        userId: USER_ID,
      })
    ).rejects.toMatchObject({ code: UPLOAD_REJECTION.fileTooLarge });
  });
});
