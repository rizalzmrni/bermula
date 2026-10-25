/**
 * Antarmuka penyimpanan objek yang netral provider. Fitur hanya bergantung pada
 * tipe ini, sehingga R2 bisa diganti S3/GCS cukup dengan implementasi baru.
 */

export interface StoredObject {
  key: string;
  size: number;
  contentType: string | undefined;
  etag: string;
  uploadedAt: Date;
}

export type StoredObjectBody = StoredObject & {
  body: ReadableStream<Uint8Array>;
};

export interface PutObjectInput {
  key: string;
  body: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob;
  contentType?: string;
}

export interface SignedUploadInput {
  key: string;
  contentType: string;
  /** Ukuran persis dalam byte; ikut ditandatangani sehingga file lain ditolak. */
  contentLength: number;
  /** Umur URL dalam detik (1–900). */
  expiresIn?: number;
  /** Waktu "sekarang", disuntikkan agar URL bisa diuji secara deterministik. */
  now?: Date;
}

export interface ContentDisposition {
  /** `inline` untuk ditampilkan (mis. `<img>`), `attachment` untuk diunduh. */
  type: "inline" | "attachment";
  /** Nama asli file yang dilihat pengguna saat mengunduh. */
  fileName: string;
}

export interface SignedDownloadInput {
  key: string;
  contentDisposition?: ContentDisposition;
  expiresIn?: number;
  now?: Date;
}

export interface SignedUrl {
  url: string;
  /** Header yang wajib dikirim klien persis seperti ini bersama request. */
  headers: Record<string, string>;
  expiresAt: Date;
}

/** Objek hasil listing; listing S3 & binding tidak memuat `content-type`. */
export interface ListedObject {
  key: string;
  size: number;
  uploadedAt: Date;
}

export interface ListObjectsInput {
  prefix: string;
  /** Dari `ObjectPage.cursor` halaman sebelumnya. */
  cursor?: string;
  /** Maksimum objek per halaman (1–1000, default 1000). */
  limit?: number;
}

export interface ObjectPage {
  objects: ListedObject[];
  /** `undefined` bila sudah halaman terakhir. */
  cursor: string | undefined;
}

export interface ObjectStorage {
  putObject: (input: PutObjectInput) => Promise<StoredObject>;
  getObject: (key: string) => Promise<StoredObjectBody | null>;
  headObject: (key: string) => Promise<StoredObject | null>;
  deleteObject: (key: string) => Promise<void>;
  listObjects: (input: ListObjectsInput) => Promise<ObjectPage>;
  getSignedUploadUrl: (input: SignedUploadInput) => Promise<SignedUrl>;
  getSignedDownloadUrl: (input: SignedDownloadInput) => Promise<SignedUrl>;
}
