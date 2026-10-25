import { AwsClient } from "aws4fetch";

export interface R2S3Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

// aws4fetch mengulang request 5xx hingga 10 kali secara default; dibatasi agar
// request API tidak tertahan lama saat R2 bermasalah.
const MAX_RETRIES = 2;

// Tiap segmen di-encode terpisah agar `/` di key tetap menjadi pemisah path.
const encodeKey = (key: string) =>
  key.split("/").map(encodeURIComponent).join("/");

/** Klien S3 API R2 bersama untuk presigner dan operasi objek. */
export const createR2S3Client = (config: R2S3Config) => {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    region: "auto",
    retries: MAX_RETRIES,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
  });
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com/${encodeURIComponent(config.bucketName)}`;

  return {
    client,
    objectUrl: (key: string) => new URL(`${endpoint}/${encodeKey(key)}`),
  };
};
