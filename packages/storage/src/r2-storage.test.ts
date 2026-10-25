import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { createR2Presigner } from "./r2-presigner";
import { createR2Storage } from "./r2-storage";

const storage = createR2Storage({
  bucket: env.BUCKET,
  presigner: createR2Presigner({
    accessKeyId: "test-access-key",
    accountId: "test-account",
    bucketName: "test-bucket",
    secretAccessKey: "test-secret-key",
  }),
});

describe("createR2Storage (local R2 binding)", () => {
  it("puts, heads, reads, and deletes an object", async () => {
    const key = "uploads/org-1/round-trip.txt";

    const stored = await storage.putObject({
      body: "halo dunia",
      contentType: "text/plain",
      key,
    });
    expect(stored).toMatchObject({ contentType: "text/plain", key, size: 10 });

    const head = await storage.headObject(key);
    expect(head?.etag).toBe(stored.etag);

    const object = await storage.getObject(key);
    await expect(new Response(object?.body).text()).resolves.toBe("halo dunia");

    await storage.deleteObject(key);
    await expect(storage.headObject(key)).resolves.toBeNull();
  });

  it("returns null for missing objects and ignores deleting them", async () => {
    const key = "uploads/org-1/missing.txt";

    await expect(storage.getObject(key)).resolves.toBeNull();
    await expect(storage.deleteObject(key)).resolves.toBeUndefined();
  });

  it("lists objects by prefix across pages", async () => {
    const keys = ["list/org-1/a.txt", "list/org-1/b.txt", "list/org-1/c.txt"];
    await Promise.all(keys.map((key) => storage.putObject({ body: "x", key })));
    await storage.putObject({ body: "x", key: "other/org-1/d.txt" });

    const first = await storage.listObjects({ limit: 2, prefix: "list/" });
    const second = await storage.listObjects({
      cursor: first.cursor,
      limit: 2,
      prefix: "list/",
    });

    expect(first.cursor).toBeDefined();
    expect(second.cursor).toBeUndefined();
    expect(
      [...first.objects, ...second.objects].map((object) => object.key)
    ).toStrictEqual(keys);
    expect(first.objects[0]).toMatchObject({ size: 1 });
  });
});
