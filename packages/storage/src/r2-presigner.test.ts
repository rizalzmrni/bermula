import { describe, expect, it } from "vitest";

import { createR2Presigner } from "./r2-presigner";

const presigner = createR2Presigner({
  accessKeyId: "test-access-key",
  accountId: "test-account",
  bucketName: "test-bucket",
  secretAccessKey: "test-secret-key",
});

const NOW = new Date("2026-10-24T13:00:00.000Z");
const KEY = "uploads/org-1/0b6f3a2c-foto profil.jpg";

describe("getSignedUploadUrl", () => {
  it("signs a PUT URL that pins content type and length", async () => {
    const signed = await presigner.getSignedUploadUrl({
      contentLength: 2048,
      contentType: "image/jpeg",
      expiresIn: 600,
      key: KEY,
      now: NOW,
    });
    const url = new URL(signed.url);

    expect(`${url.origin}${url.pathname}`).toBe(
      "https://test-account.r2.cloudflarestorage.com/test-bucket/uploads/org-1/0b6f3a2c-foto%20profil.jpg"
    );
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": "test-access-key/20261024/auto/s3/aws4_request",
      "X-Amz-Date": "20261024T130000Z",
      "X-Amz-Expires": "600",
      "X-Amz-SignedHeaders": "content-length;content-type;host",
    });
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/u);
    expect(signed.headers).toStrictEqual({
      "content-length": "2048",
      "content-type": "image/jpeg",
    });
    expect(signed.expiresAt).toStrictEqual(
      new Date("2026-10-24T13:10:00.000Z")
    );
  });

  it("is deterministic for the same input and changes with the content type", async () => {
    const input = {
      contentLength: 10,
      contentType: "image/png",
      key: KEY,
      now: NOW,
    };
    const first = await presigner.getSignedUploadUrl(input);
    const second = await presigner.getSignedUploadUrl(input);
    const otherType = await presigner.getSignedUploadUrl({
      ...input,
      contentType: "text/html",
    });

    expect(second.url).toBe(first.url);
    expect(otherType.url).not.toBe(first.url);
  });

  it("rejects invalid lengths and lifetimes", async () => {
    const base = { contentType: "image/png", key: KEY, now: NOW };

    await expect(
      presigner.getSignedUploadUrl({ ...base, contentLength: 0 })
    ).rejects.toThrow(RangeError);
    await expect(
      presigner.getSignedUploadUrl({
        ...base,
        contentLength: 10,
        expiresIn: 901,
      })
    ).rejects.toThrow(RangeError);
  });
});

describe("getSignedDownloadUrl", () => {
  it("signs a GET URL with the default 5 minute lifetime", async () => {
    const signed = await presigner.getSignedDownloadUrl({ key: KEY, now: NOW });
    const url = new URL(signed.url);

    expect(url.searchParams.get("X-Amz-Expires")).toBe("300");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toBe("host");
    expect(signed.headers).toStrictEqual({});
    expect(signed.expiresAt).toStrictEqual(
      new Date("2026-10-24T13:05:00.000Z")
    );
  });
});
