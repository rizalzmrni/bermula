import type {
  ObjectStorage,
  StoredObject,
} from "@bermula/storage/object-storage";

const DEFAULT_PAGE_SIZE = 1000;
const SIGNED_URL_TTL_MS = 60_000;

/**
 * `ObjectStorage` di memori untuk test service. `seed` menaruh objek dengan
 * waktu upload tertentu (R2 asli tidak bisa memundurkan `LastModified`).
 */
export const createMemoryStorage = (now = new Date()) => {
  const objects = new Map<string, StoredObject>();

  const seed = (
    key: string,
    object: Partial<Omit<StoredObject, "key">> = {}
  ) => {
    objects.set(key, {
      contentType: "application/octet-stream",
      etag: "memory",
      key,
      size: 1,
      uploadedAt: now,
      ...object,
    });
  };

  const signedUrl = (key: string, headers: Record<string, string> = {}) =>
    Promise.resolve({
      expiresAt: new Date(now.getTime() + SIGNED_URL_TTL_MS),
      headers,
      url: `https://storage.test/${key}`,
    });

  const storage: ObjectStorage = {
    deleteObject: (key) => {
      objects.delete(key);
      return Promise.resolve();
    },
    getObject: (key) => {
      const object = objects.get(key);
      return Promise.resolve(
        object ? { ...object, body: new ReadableStream() } : null
      );
    },
    getSignedDownloadUrl: ({ key }) => signedUrl(key),
    getSignedUploadUrl: ({ contentType, key }) =>
      signedUrl(key, { "content-type": contentType }),
    headObject: (key) => Promise.resolve(objects.get(key) ?? null),
    // Cursor = key terakhir halaman sebelumnya, urut leksikografis seperti R2.
    listObjects: ({ cursor, limit = DEFAULT_PAGE_SIZE, prefix }) => {
      const keys = [...objects.keys()]
        .filter((key) => key.startsWith(prefix))
        .filter((key) => cursor === undefined || key > cursor)
        .toSorted();
      const page = keys.slice(0, limit);
      return Promise.resolve({
        cursor: keys.length > limit ? page.at(-1) : undefined,
        objects: page.flatMap((key) => {
          const object = objects.get(key);
          return object
            ? [{ key, size: object.size, uploadedAt: object.uploadedAt }]
            : [];
        }),
      });
    },
    putObject: ({ contentType, key }) => {
      seed(key, { contentType });
      const stored = objects.get(key);
      if (!stored) {
        throw new Error(`Memory storage lost "${key}" right after put`);
      }
      return Promise.resolve(stored);
    },
  };

  return { keys: () => [...objects.keys()].toSorted(), seed, storage };
};
