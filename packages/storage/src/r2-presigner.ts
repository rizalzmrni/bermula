import { AwsClient } from "aws4fetch";

import type {
  SignedDownloadInput,
  SignedUploadInput,
  SignedUrl,
} from "./object-storage";

const DEFAULT_EXPIRES_IN_SECONDS = 300;
// Presigned URL berumur pendek; aturan paket membatasi maksimal 15 menit.
const MAX_EXPIRES_IN_SECONDS = 900;
const MS_PER_SECOND = 1000;
// `2026-10-24T13:00:00.000Z` → `20261024T130000Z`, format waktu SigV4.
const ISO_SEPARATORS = /[:-]|\.\d{3}/gu;

export interface R2PresignerConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export interface R2Presigner {
  getSignedUploadUrl: (input: SignedUploadInput) => Promise<SignedUrl>;
  getSignedDownloadUrl: (input: SignedDownloadInput) => Promise<SignedUrl>;
}

const toAmzDate = (date: Date) =>
  date.toISOString().replaceAll(ISO_SEPARATORS, "");

const resolveExpiresIn = (expiresIn = DEFAULT_EXPIRES_IN_SECONDS) => {
  if (
    !Number.isInteger(expiresIn) ||
    expiresIn < 1 ||
    expiresIn > MAX_EXPIRES_IN_SECONDS
  ) {
    throw new RangeError(
      `expiresIn must be an integer between 1 and ${MAX_EXPIRES_IN_SECONDS} seconds`
    );
  }
  return expiresIn;
};

// Tiap segmen di-encode terpisah agar `/` di key tetap menjadi pemisah path.
const encodeKey = (key: string) =>
  key.split("/").map(encodeURIComponent).join("/");

/**
 * Presigned URL lewat S3 API R2. Binding Worker tidak bisa menandatangani URL,
 * jadi jalur ini butuh token S3 API (izin minimum: object read/write di satu
 * bucket).
 */
export const createR2Presigner = (config: R2PresignerConfig): R2Presigner => {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    region: "auto",
    secretAccessKey: config.secretAccessKey,
    service: "s3",
  });
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com/${encodeURIComponent(config.bucketName)}`;

  const sign = async ({
    expiresIn,
    headers,
    key,
    method,
    now = new Date(),
  }: {
    expiresIn: number | undefined;
    headers: Record<string, string>;
    key: string;
    method: "GET" | "PUT";
    now: Date | undefined;
  }): Promise<SignedUrl> => {
    const seconds = resolveExpiresIn(expiresIn);
    const url = new URL(`${endpoint}/${encodeKey(key)}`);
    url.searchParams.set("X-Amz-Expires", String(seconds));

    const signed = await client.sign(url, {
      // `content-type` & `content-length` tidak ditandatangani aws4fetch secara
      // default; `allHeaders` memasukkannya sehingga R2 menolak upload yang
      // tipe atau ukurannya berbeda dari yang sudah divalidasi.
      aws: { allHeaders: true, datetime: toAmzDate(now), signQuery: true },
      headers,
      method,
    });

    return {
      expiresAt: new Date(now.getTime() + seconds * MS_PER_SECOND),
      headers,
      url: signed.url,
    };
  };

  return {
    getSignedDownloadUrl: ({ expiresIn, key, now }) =>
      sign({ expiresIn, headers: {}, key, method: "GET", now }),
    getSignedUploadUrl: async ({
      contentLength,
      contentType,
      expiresIn,
      key,
      now,
    }) => {
      if (!Number.isSafeInteger(contentLength) || contentLength <= 0) {
        throw new RangeError("contentLength must be a positive integer");
      }
      return await sign({
        expiresIn,
        headers: {
          "content-length": String(contentLength),
          "content-type": contentType,
        },
        key,
        method: "PUT",
        now,
      });
    },
  };
};
