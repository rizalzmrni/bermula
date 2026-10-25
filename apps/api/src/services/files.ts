import {
  FILE_STATUS,
  UPLOAD_POLICIES,
  UPLOAD_REJECTION,
  toMediaType,
  validateUpload,
} from "@bermula/core/files";
import type {
  FileKind,
  UploadRejection,
  UploadRequest,
} from "@bermula/core/files";
import type { Db } from "@bermula/db/client";
import { files } from "@bermula/db/schema/storage";
import type { StoredFile } from "@bermula/db/schema/storage";
import { createObjectKey } from "@bermula/storage/object-key";
import type {
  ObjectStorage,
  StoredObject,
} from "@bermula/storage/object-storage";
import { and, desc, eq, sql } from "drizzle-orm";

import { ApiError } from "../lib/errors";

/** Segmen URL (`/api/images`) sekaligus prefix key R2 (`images/<org>/...`). */
export const FILE_KIND_PATH = {
  document: "documents",
  image: "images",
} as const satisfies Record<FileKind, string>;

// Upload file besar di koneksi lambat bisa lama dimulai; URL tetap pendek.
const UPLOAD_URL_TTL_SECONDS = 600;
const DOWNLOAD_URL_TTL_SECONDS = 300;
// Role organisasi yang boleh menghapus file anggota lain.
const FILE_MANAGER_ROLES = new Set(["owner", "admin"]);

/** Organisasi aktif + jenis file: setiap query dibatasi keduanya. */
export interface FileScope {
  db: Db;
  storage: ObjectStorage;
  organizationId: string;
  kind: FileKind;
}

const REJECTION_MESSAGES = {
  [UPLOAD_REJECTION.emptyFile]: "File kosong atau ukurannya tidak valid.",
  [UPLOAD_REJECTION.fileTooLarge]: "Ukuran file melebihi batas.",
  [UPLOAD_REJECTION.unsupportedType]: "Jenis file tidak didukung.",
} as const satisfies Record<UploadRejection, string>;

const notFound = () =>
  new ApiError({
    code: "FILE_NOT_FOUND",
    message: "File tidak ditemukan.",
    status: 404,
  });

/** Bentuk respons API: tanggal sebagai ISO string, tanpa key R2 internal. */
export const toFileResponse = (file: StoredFile) => ({
  contentType: file.contentType,
  createdAt: file.createdAt.toISOString(),
  fileName: file.fileName,
  id: file.id,
  kind: file.kind,
  size: file.size,
  status: file.status,
  uploadedAt: file.uploadedAt?.toISOString() ?? null,
  uploadedBy: file.uploadedBy,
});

/**
 * Pengunggah boleh menghapus filenya sendiri; owner/admin organisasi boleh
 * menghapus semua file. Role better-auth bisa berisi beberapa nilai (`a,b`).
 */
export const canDeleteFile = ({
  file,
  role,
  userId,
}: {
  file: Pick<StoredFile, "uploadedBy">;
  role: string;
  userId: string;
}) =>
  file.uploadedBy === userId ||
  role.split(",").some((value) => FILE_MANAGER_ROLES.has(value.trim()));

export const UPLOAD_CHECK = {
  matches: "matches",
  mismatch: "mismatch",
  missing: "missing",
} as const;

/** Objek di R2 harus ada dan sama ukuran & tipenya dengan yang divalidasi. */
export const checkUploadedObject = (
  file: Pick<StoredFile, "contentType" | "size">,
  object: StoredObject | null
) => {
  if (!object) {
    return UPLOAD_CHECK.missing;
  }
  const isSame =
    object.size === file.size &&
    toMediaType(object.contentType ?? "") === file.contentType;
  return isSame ? UPLOAD_CHECK.matches : UPLOAD_CHECK.mismatch;
};

const scopeFilter = ({ kind, organizationId }: FileScope) =>
  and(eq(files.organizationId, organizationId), eq(files.kind, kind));

const findFile = async (scope: FileScope, id: string) => {
  const [file] = await scope.db
    .select()
    .from(files)
    .where(and(scopeFilter(scope), eq(files.id, id)))
    .limit(1);
  return file;
};

/**
 * Langkah 1 upload: validasi kebijakan, simpan baris `pending`, lalu beri
 * presigned PUT URL. Tipe & ukuran ikut ditandatangani, jadi R2 menolak byte
 * yang berbeda dari yang divalidasi di sini.
 */
export const createUpload = async ({
  input,
  now = new Date(),
  scope,
  userId,
}: {
  input: UploadRequest;
  now?: Date;
  scope: FileScope;
  userId: string;
}) => {
  const policy = UPLOAD_POLICIES[scope.kind];
  const validation = validateUpload(input, policy);
  if (!validation.ok) {
    throw new ApiError({
      code: validation.reason,
      details: {
        allowedContentTypes: policy.allowedContentTypes,
        maxSize: policy.maxSize,
      },
      message: REJECTION_MESSAGES[validation.reason],
      status: 400,
    });
  }

  const contentType = toMediaType(input.contentType);
  const key = createObjectKey({
    category: FILE_KIND_PATH[scope.kind],
    fileName: input.fileName,
    organizationId: scope.organizationId,
  });
  // Ditandatangani lebih dulu: bila gagal, belum ada baris yatim di DB.
  const upload = await scope.storage.getSignedUploadUrl({
    contentLength: input.size,
    contentType,
    expiresIn: UPLOAD_URL_TTL_SECONDS,
    key,
    now,
  });

  const [file] = await scope.db
    .insert(files)
    .values({
      contentType,
      fileName: input.fileName,
      key,
      kind: scope.kind,
      organizationId: scope.organizationId,
      size: input.size,
      uploadedBy: userId,
    })
    .returning();
  if (!file) {
    throw new Error("Insert into storage_files returned no row");
  }

  return { file, upload };
};

/**
 * Langkah 2 upload: pastikan objek benar-benar ada di R2 sebelum file
 * dianggap ada. Idempoten untuk file yang sudah `uploaded`.
 */
export const completeUpload = async ({
  id,
  now = new Date(),
  scope,
}: {
  id: string;
  now?: Date;
  scope: FileScope;
}) => {
  const file = await findFile(scope, id);
  if (!file) {
    throw notFound();
  }
  if (file.status === FILE_STATUS.uploaded) {
    return file;
  }

  const check = checkUploadedObject(
    file,
    await scope.storage.headObject(file.key)
  );
  if (check === UPLOAD_CHECK.missing) {
    throw new ApiError({
      code: "UPLOAD_NOT_FOUND",
      message: "File belum diunggah ke penyimpanan.",
      status: 409,
    });
  }
  if (check === UPLOAD_CHECK.mismatch) {
    // Seharusnya mustahil karena tipe & ukuran ditandatangani; tetap dibuang
    // agar byte yang tidak tervalidasi tidak tersisa.
    await scope.storage.deleteObject(file.key);
    await scope.db.delete(files).where(eq(files.id, file.id));
    throw new ApiError({
      code: "UPLOAD_MISMATCH",
      message: "File yang diunggah tidak sesuai. Silakan unggah ulang.",
      status: 409,
    });
  }

  const [updated] = await scope.db
    .update(files)
    .set({ status: FILE_STATUS.uploaded, uploadedAt: now })
    .where(eq(files.id, file.id))
    .returning();
  return updated ?? file;
};

/**
 * File `uploaded` terbaru dulu dengan paginasi keyset: `cursor` = id item
 * terakhir halaman sebelumnya. Posisinya dibaca dari DB agar presisi
 * mikrodetik `created_at` tidak hilang lewat `Date` JavaScript.
 */
export const listFiles = async ({
  cursor,
  limit,
  scope,
}: {
  cursor: string | undefined;
  limit: number;
  scope: FileScope;
}) => {
  const afterCursor = cursor
    ? sql`(${files.createdAt}, ${files.id}) < (select ${files.createdAt}, ${files.id} from ${files} where ${files.id} = ${cursor} and ${files.organizationId} = ${scope.organizationId})`
    : undefined;

  const rows = await scope.db
    .select()
    .from(files)
    .where(
      and(
        scopeFilter(scope),
        eq(files.status, FILE_STATUS.uploaded),
        afterCursor
      )
    )
    .orderBy(desc(files.createdAt), desc(files.id))
    .limit(limit + 1);

  const items = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  return { items, nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null };
};

/** Presigned GET URL; image ditampilkan inline, dokumen diunduh. */
export const getDownloadUrl = async ({
  id,
  scope,
}: {
  id: string;
  scope: FileScope;
}) => {
  const file = await findFile(scope, id);
  if (file?.status !== FILE_STATUS.uploaded) {
    throw notFound();
  }

  return await scope.storage.getSignedDownloadUrl({
    contentDisposition: {
      fileName: file.fileName,
      type: scope.kind === "image" ? "inline" : "attachment",
    },
    expiresIn: DOWNLOAD_URL_TTL_SECONDS,
    key: file.key,
  });
};

/** Hapus objek R2 lebih dulu; bila gagal, baris tetap ada dan bisa diulang. */
export const deleteFile = async ({
  id,
  role,
  scope,
  userId,
}: {
  id: string;
  role: string;
  scope: FileScope;
  userId: string;
}) => {
  const file = await findFile(scope, id);
  if (!file) {
    throw notFound();
  }
  if (!canDeleteFile({ file, role, userId })) {
    throw new ApiError({
      code: "FORBIDDEN",
      message:
        "Hanya pengunggah atau admin organisasi yang dapat menghapus file ini.",
      status: 403,
    });
  }

  await scope.storage.deleteObject(file.key);
  await scope.db.delete(files).where(eq(files.id, file.id));
};
