import { z } from "zod";

/**
 * Aturan file bersama klien (umpan balik instan di form) dan server (validasi
 * sebelum membuat presigned URL). Ubah batas di sini; api & app ikut berubah.
 */

export const FILE_KIND = {
  document: "document",
  image: "image",
} as const;

export type FileKind = (typeof FILE_KIND)[keyof typeof FILE_KIND];

export const FILE_STATUS = {
  /** Baris dibuat & presigned URL diberikan; byte belum dipastikan ada di R2. */
  pending: "pending",
  /** Objek sudah dicek ada di R2 dengan ukuran & tipe yang cocok. */
  uploaded: "uploaded",
} as const;

export type FileStatus = (typeof FILE_STATUS)[keyof typeof FILE_STATUS];

export interface UploadPolicy {
  /** Ukuran maksimum dalam byte. */
  maxSize: number;
  /** Daftar MIME type persis, mis. `image/png`, atau wildcard `image/*`. */
  allowedContentTypes: readonly string[];
}

const MEBIBYTE = 1024 * 1024;

export const UPLOAD_POLICIES = {
  document: {
    allowedContentTypes: [
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    maxSize: 10 * MEBIBYTE,
  },
  // Daftar eksplisit, bukan `image/*`: SVG bisa memuat skrip.
  image: {
    allowedContentTypes: [
      "image/avif",
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/webp",
    ],
    maxSize: 5 * MEBIBYTE,
  },
} as const satisfies Record<FileKind, UploadPolicy>;

export const UPLOAD_REJECTION = {
  emptyFile: "EMPTY_FILE",
  fileTooLarge: "FILE_TOO_LARGE",
  unsupportedType: "UNSUPPORTED_TYPE",
} as const;

export type UploadRejection =
  (typeof UPLOAD_REJECTION)[keyof typeof UPLOAD_REJECTION];

export type UploadValidation =
  | { ok: true }
  | { ok: false; reason: UploadRejection };

// Parameter MIME (`; charset=utf-8`) diabaikan saat mencocokkan tipe.
export const toMediaType = (contentType: string) =>
  contentType.split(";")[0]?.trim().toLowerCase() ?? "";

const matchesContentType = (mediaType: string, allowed: string) => {
  const pattern = allowed.toLowerCase();
  return pattern.endsWith("/*")
    ? mediaType.startsWith(pattern.slice(0, -1))
    : mediaType === pattern;
};

/** Cek tipe & ukuran file terhadap kebijakan. */
export const validateUpload = (
  request: { contentType: string; size: number },
  policy: UploadPolicy
): UploadValidation => {
  if (!Number.isSafeInteger(request.size) || request.size <= 0) {
    return { ok: false, reason: UPLOAD_REJECTION.emptyFile };
  }
  if (request.size > policy.maxSize) {
    return { ok: false, reason: UPLOAD_REJECTION.fileTooLarge };
  }

  const mediaType = toMediaType(request.contentType);
  const isAllowed = policy.allowedContentTypes.some((allowed) =>
    matchesContentType(mediaType, allowed)
  );
  return isAllowed
    ? { ok: true }
    : { ok: false, reason: UPLOAD_REJECTION.unsupportedType };
};

const MAX_FILE_NAME_LENGTH = 255;

/** Metadata yang dikirim klien sebelum upload; kebijakan dicek terpisah. */
export const uploadRequestSchema = z.object({
  contentType: z.string().trim().min(1).max(MAX_FILE_NAME_LENGTH),
  fileName: z.string().trim().min(1).max(MAX_FILE_NAME_LENGTH),
  size: z.int().positive(),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;
