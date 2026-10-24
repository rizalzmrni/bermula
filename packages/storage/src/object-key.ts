const FALLBACK_FILE_NAME = "file";
// Batas aman di bawah 1024 byte key R2/S3, menyisakan ruang untuk prefix + uuid.
const MAX_FILE_NAME_LENGTH = 100;

// Tanda diakritik terpisah hasil `normalize("NFKD")`, mis. `é` → `e` + U+0301.
const COMBINING_MARKS = /\p{Mn}/gu;
const UNSAFE_CHARACTERS = /[^a-z0-9._-]+/gu;
const REPEATED_SEPARATORS = /[-_.]{2,}/gu;
const EDGE_SEPARATORS = /^[-_.]+|[-_.]+$/gu;
const OWNER_ID = /^[A-Za-z0-9-]+$/u;
const CATEGORY = /^[a-z0-9-]+$/u;

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

interface OwnerScope {
  /** Kelompok file, mis. `images` atau `documents`; huruf kecil, angka, `-`. */
  category: string;
  organizationId: string;
}

/** Prefix semua objek satu kelompok milik satu organisasi: `<category>/<organization_id>/`. */
export const toOwnerPrefix = ({
  category,
  organizationId,
}: OwnerScope): string => {
  if (!CATEGORY.test(category)) {
    throw new Error(
      "category must contain only lowercase letters, digits, or -"
    );
  }
  if (!OWNER_ID.test(organizationId)) {
    throw new Error("organizationId must be a non-empty id without slashes");
  }
  return `${category}/${organizationId}/`;
};

/**
 * Key unik `<category>/<organization_id>/<uuid>-<nama-aman>`. Prefix per
 * kelompok memudahkan aturan lifecycle R2 yang berbeda (mis. image vs dokumen).
 * `id` bisa disuntikkan agar hasilnya deterministik di test.
 */
export const createObjectKey = ({
  fileName,
  id = crypto.randomUUID(),
  ...scope
}: OwnerScope & { fileName: string; id?: string }): string =>
  `${toOwnerPrefix(scope)}${id}-${sanitizeFileName(fileName)}`;

/**
 * Pengaman tambahan sebelum memberi akses: key harus berada langsung di prefix
 * kelompok & organisasi. Bukan pengganti cek kepemilikan lewat metadata di
 * Postgres.
 */
export const isObjectKeyOwnedBy = ({
  key,
  ...scope
}: OwnerScope & { key: string }): boolean => {
  const prefix = toOwnerPrefix(scope);
  return (
    key.startsWith(prefix) &&
    key.length > prefix.length &&
    !key.slice(prefix.length).includes("/")
  );
};
