export interface UploadPolicy {
  /** Ukuran maksimum dalam byte. */
  maxSize: number;
  /** Daftar MIME type persis, mis. `image/png`, atau wildcard `image/*`. */
  allowedContentTypes: readonly string[];
}

export interface UploadRequest {
  contentType: string;
  size: number;
}

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
const toMediaType = (contentType: string) =>
  contentType.split(";")[0]?.trim().toLowerCase() ?? "";

const matchesContentType = (mediaType: string, allowed: string) => {
  const pattern = allowed.toLowerCase();
  return pattern.endsWith("/*")
    ? mediaType.startsWith(pattern.slice(0, -1))
    : mediaType === pattern;
};

/**
 * Cek tipe & ukuran sebelum membuat presigned URL upload. Fungsi murni: service
 * memanggilnya, lalu tipe & ukuran yang lolos ikut ditandatangani di URL.
 */
export const validateUpload = (
  request: UploadRequest,
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
