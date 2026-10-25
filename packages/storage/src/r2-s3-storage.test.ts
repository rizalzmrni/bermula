import { describe, expect, it, vi } from "vitest";

import { createR2S3Storage } from "./r2-s3-storage";

const storage = createR2S3Storage({
  accessKeyId: "test-access-key",
  accountId: "test-account",
  bucketName: "test-bucket",
  secretAccessKey: "test-secret-key",
});

const OBJECT_URL =
  "https://test-account.r2.cloudflarestorage.com/test-bucket/images/org-1/a.png";
const OBJECT_HEADERS = {
  "content-length": "2048",
  "content-type": "image/png",
  etag: '"abc123"',
  "last-modified": "Sat, 24 Oct 2026 13:00:00 GMT",
};

// aws4fetch memanggil `fetch` global dengan Request yang sudah ditandatangani.
const stubFetch = (response: () => Response) => {
  const fetchMock = vi.fn<(request: Request) => Promise<Response>>(() =>
    Promise.resolve(response())
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("headObject", () => {
  it("sends a signed HEAD and maps S3 headers", async () => {
    const fetchMock = stubFetch(
      () => new Response(null, { headers: OBJECT_HEADERS })
    );

    const object = await storage.headObject("images/org-1/a.png");
    const [request] = fetchMock.mock.calls[0] ?? [];

    expect(request?.method).toBe("HEAD");
    expect(request?.url).toBe(OBJECT_URL);
    expect(request?.headers.get("authorization")).toMatch(
      /^AWS4-HMAC-SHA256 Credential=test-access-key\/\d{8}\/auto\/s3\//u
    );
    expect(object).toStrictEqual({
      contentType: "image/png",
      etag: "abc123",
      key: "images/org-1/a.png",
      size: 2048,
      uploadedAt: new Date("2026-10-24T13:00:00.000Z"),
    });
  });

  it("returns null when the object does not exist", async () => {
    stubFetch(() => new Response(null, { status: 404 }));

    await expect(
      storage.headObject("images/org-1/missing.png")
    ).resolves.toBeNull();
  });

  it("throws on other errors instead of hiding them", async () => {
    stubFetch(() => new Response(null, { status: 403 }));

    await expect(storage.headObject("images/org-1/a.png")).rejects.toThrow(
      /HEAD failed with status 403/u
    );
  });
});

describe("deleteObject", () => {
  it("sends a signed DELETE and treats 404 as done", async () => {
    const fetchMock = stubFetch(() => new Response(null, { status: 404 }));

    await expect(
      storage.deleteObject("images/org-1/a.png")
    ).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0]?.[0].method).toBe("DELETE");
  });
});

describe("getObject", () => {
  it("returns the body stream with metadata", async () => {
    stubFetch(() => new Response("isi", { headers: OBJECT_HEADERS }));

    const object = await storage.getObject("images/org-1/a.png");

    expect(object?.etag).toBe("abc123");
    await expect(new Response(object?.body).text()).resolves.toBe("isi");
  });
});
