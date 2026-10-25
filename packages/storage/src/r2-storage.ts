import type { ObjectStorage, StoredObject } from "./object-storage";
import type { R2Presigner } from "./r2-presigner";

const toStoredObject = (object: R2Object): StoredObject => ({
  contentType: object.httpMetadata?.contentType,
  etag: object.etag,
  key: object.key,
  size: object.size,
  uploadedAt: object.uploaded,
});

/**
 * Implementasi `ObjectStorage` untuk Cloudflare R2: operasi server-side lewat
 * binding Worker, presigned URL lewat S3 API. Dibuat per request karena binding
 * baru tersedia di `c.env`.
 */
export const createR2Storage = ({
  bucket,
  presigner,
}: {
  bucket: R2Bucket;
  presigner: R2Presigner;
}): ObjectStorage => ({
  deleteObject: async (key) => {
    await bucket.delete(key);
  },
  getObject: async (key) => {
    const object = await bucket.get(key);
    return object ? { ...toStoredObject(object), body: object.body } : null;
  },
  getSignedDownloadUrl: presigner.getSignedDownloadUrl,
  getSignedUploadUrl: presigner.getSignedUploadUrl,
  headObject: async (key) => {
    const object = await bucket.head(key);
    return object ? toStoredObject(object) : null;
  },
  putObject: async ({ body, contentType, key }) => {
    const object = await bucket.put(key, body, {
      httpMetadata: contentType ? { contentType } : undefined,
    });
    // `put` hanya mengembalikan null bila memakai `onlyIf` yang gagal.
    if (!object) {
      throw new Error(`R2 rejected put for key "${key}"`);
    }
    return toStoredObject(object);
  },
});
