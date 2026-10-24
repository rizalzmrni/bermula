const UPLOADS_PREFIX = "uploads";
const FALLBACK_FILE_NAME = "file";
// Batas aman di bawah 1024 byte key R2/S3, menyisakan ruang untuk prefix + uuid.
const MAX_FILE_NAME_LENGTH = 100;

const COMBINING_MARKS = /[̀-ͯ]/gu;
const UNSAFE_CHARACTERS = /[^a-z0-9._-]+/gu;
const REPEATED_SEPARATORS = /[-_.]{2,}/gu;
const EDGE_SEPARATORS = /^[-_.]+|[-_.]+$/gu;
const OWNER_ID = /^[A-Za-z0-9-]+$/u;

/**
 * Nama file aman untuk key: huruf kecil ASCII, angka, `.`, `_`, `-`. Membuang
 * path (`../`), spasi, dan karakter kontrol agar key tidak bisa keluar dari
 * prefix pemiliknya. Nama asli tetap disimpan di metadata Postgres.
 */
export const sanitizeFileName = (fileName: string): string => {
  const baseName = fileName.split(/[/\\]/u).at(-1) ?? "";
  const safe = baseName
    .normalize("NFKD")
    .replaceAll(COMBINING_MARKS, "")
    .toLowerCase()
    .replaceAll(UNSAFE_CHARACTERS, "-")
    .replaceAll(REPEATED_SEPARATORS, "-")
    .replaceAll(EDGE_SEPARATORS, "")
    .slice(-MAX_FILE_NAME_LENGTH)
    .replaceAll(EDGE_SEPARATORS, "");

  return safe === "" ? FALLBACK_FILE_NAME : safe;
};

const assertOwnerId = (organizationId: string) => {
  if (!OWNER_ID.test(organizationId)) {
    throw new Error("organizationId must be a non-empty id without slashes");
  }
};

/** Prefix semua objek milik satu organisasi, mis. `uploads/<id>/`. */
export const toOwnerPrefix = (organizationId: string): string => {
  assertOwnerId(organizationId);
  return `${UPLOADS_PREFIX}/${organizationId}/`;
};

/**
 * Key unik `uploads/<organization_id>/<uuid>-<nama-aman>`. `id` bisa
 * disuntikkan agar hasilnya deterministik di test.
 */
export const createObjectKey = ({
  fileName,
  id = crypto.randomUUID(),
  organizationId,
}: {
  fileName: string;
  id?: string;
  organizationId: string;
}): string =>
  `${toOwnerPrefix(organizationId)}${id}-${sanitizeFileName(fileName)}`;

/**
 * Pengaman tambahan sebelum memberi akses: key harus berada di prefix
 * organisasi. Bukan pengganti cek kepemilikan lewat metadata di Postgres.
 */
export const isObjectKeyOwnedBy = ({
  key,
  organizationId,
}: {
  key: string;
  organizationId: string;
}): boolean => {
  const prefix = toOwnerPrefix(organizationId);
  return (
    key.startsWith(prefix) &&
    key.length > prefix.length &&
    !key.slice(prefix.length).includes("/")
  );
};
