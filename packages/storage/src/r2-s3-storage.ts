import type { ObjectStorage, StoredObject } from "./object-storage";
import { createR2Presigner } from "./r2-presigner";
import type { R2PresignerConfig } from "./r2-presigner";
import { createR2S3Client } from "./r2-s3-client";
import { parseListObjectsResponse } from "./s3-list-objects";

const NOT_FOUND = 404;
// ETag S3 dikirim berkutip (`"abc"`); bentuk binding R2 tanpa kutip.
const ETAG_QUOTES = /^"|"$/gu;

const toStoredObject = (key: string, response: Response): StoredObject => ({
  contentType: response.headers.get("content-type") ?? undefined,
  etag: (response.headers.get("etag") ?? "").replaceAll(ETAG_QUOTES, ""),
  key,
  size: Number(response.headers.get("content-length") ?? 0),
  uploadedAt: new Date(response.headers.get("last-modified") ?? 0),
});

const assertOk = (response: Response, operation: string) => {
  if (!response.ok) {
    throw new Error(
      `R2 ${operation} failed with status ${response.status} ${response.statusText}`
    );
  }
};

/**
 * Implementasi `ObjectStorage` yang seluruhnya memakai S3 API R2. Dipakai bila
 * operasi server harus melihat bucket yang sama dengan presigned URL: di
 * `wrangler dev` binding R2 memakai bucket simulasi lokal, sedangkan presigned
 * URL selalu menuju bucket asli.
 */
export const createR2S3Storage = (config: R2PresignerConfig): ObjectStorage => {
  const { bucketUrl, client, objectUrl } = createR2S3Client(config);
  const presigner = createR2Presigner(config);

  const headObject = async (key: string) => {
    const response = await client.fetch(objectUrl(key), { method: "HEAD" });
    if (response.status === NOT_FOUND) {
      return null;
    }
    assertOk(response, "HEAD");
    return toStoredObject(key, response);
  };

  return {
    deleteObject: async (key) => {
      const response = await client.fetch(objectUrl(key), {
        method: "DELETE",
      });
      // S3 membalas 204 juga untuk key yang tidak ada; 404 tetap dianggap selesai.
      if (response.status !== NOT_FOUND) {
        assertOk(response, "DELETE");
      }
    },
    getObject: async (key) => {
      const response = await client.fetch(objectUrl(key), { method: "GET" });
      if (response.status === NOT_FOUND) {
        await response.body?.cancel();
        return null;
      }
      assertOk(response, "GET");
      if (!response.body) {
        throw new Error(`R2 GET returned no body for key "${key}"`);
      }
      return { ...toStoredObject(key, response), body: response.body };
    },
    getSignedDownloadUrl: presigner.getSignedDownloadUrl,
    getSignedUploadUrl: presigner.getSignedUploadUrl,
    headObject,
    listObjects: async ({ cursor, limit, prefix }) => {
      const url = bucketUrl();
      url.searchParams.set("list-type", "2");
      url.searchParams.set("prefix", prefix);
      if (limit !== undefined) {
        url.searchParams.set("max-keys", String(limit));
      }
      if (cursor !== undefined) {
        url.searchParams.set("continuation-token", cursor);
      }
      const response = await client.fetch(url, { method: "GET" });
      assertOk(response, "LIST");
      return parseListObjectsResponse(await response.text());
    },
    putObject: async ({ body, contentType, key }) => {
      const response = await client.fetch(objectUrl(key), {
        body,
        headers: contentType ? { "content-type": contentType } : {},
        method: "PUT",
      });
      assertOk(response, "PUT");
      // Respons PUT S3 tidak memuat ukuran & waktu; ambil dari HEAD.
      const stored = await headObject(key);
      if (!stored) {
        throw new Error(`R2 object "${key}" missing right after PUT`);
      }
      return stored;
    },
  };
};
