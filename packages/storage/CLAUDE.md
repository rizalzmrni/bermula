# packages/storage — Cloudflare R2

Aturan root `CLAUDE.md` tetap berlaku.

## Antarmuka

Semua akses R2 lewat antarmuka netral di paket ini: `putObject`, `getObject`,
`deleteObject`, `getSignedUploadUrl`, `getSignedDownloadUrl`. Route dan service
tidak memanggil binding R2 langsung, agar provider bisa diganti (R2 → S3/GCS)
tanpa menyentuh fitur.

## Dua jalur akses

| Jalur                                    | Dipakai untuk                                                   | Kredensial                                                                                     |
| ---------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Binding Worker** (`env.BUCKET`)        | Operasi server-side: put/get/delete kecil, cek keberadaan objek | Tidak ada secret; nama bucket di `wrangler.jsonc`                                              |
| **S3 API + presigned URL** (`aws4fetch`) | Upload/download langsung dari browser (file besar)              | R2 S3 API token: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`, `R2_BUCKET_NAME` |

- Binding Worker **tidak bisa** membuat presigned URL; jalur kedua wajib
  memakai kredensial S3 API.
- Kredensial S3 API adalah secret: catat di `.dev.vars.example` app yang
  memakainya (biasanya `apps/api`), skema t3-env, dan setel produksi dengan
  `wrangler secret put`. Buat token dengan izin minimum (hanya bucket ini,
  object read/write).
- `aws4fetch` dipasang langsung di paket ini (hanya dipakai di sini → tanpa
  catalog).

## Aturan

- Upload file besar dari klien lewat presigned URL, bukan mem-proxy byte lewat
  Worker (batas memori/ukuran Worker).
- Bucket privat; presigned URL berumur pendek (mis. ≤15 menit). Hanya aset yang
  memang publik (mis. logo) yang boleh publik, di bucket/prefix terpisah.
- Key berawalan pemilik sesuai keputusan scoping (per-organisasi):
  `<kelompok>/<organization_id>/<uuid>-<nama-aman>` (mis. `images/...`,
  `documents/...`), dibuat dengan `createObjectKey`. Nama file disanitasi
  (`sanitizeFileName`).
- Service memverifikasi kepemilikan (lewat metadata di Postgres) **sebelum**
  memberi URL akses.
- Metadata file (nama asli, tipe, ukuran, key, pemilik) disimpan di Postgres;
  R2 hanya menyimpan byte-nya.
- Validasi tipe & ukuran file di server sebelum membuat presigned URL upload
  (`validateUpload` + `UPLOAD_POLICIES` di `@bermula/core/files`, dipakai juga
  oleh klien). Tipe & ukuran ikut ditandatangani di URL; R2 menolak yang beda
  (terverifikasi ke bucket asli 2026-10-24).
- Nama bucket dari binding/env; jangan hardcode.
- Konfigurasi CORS bucket R2 untuk origin `APP_URL` agar upload dari browser
  berhasil; tulis langkahnya di laporan sebagai langkah manual. Aturan dev ada
  di `r2-cors.dev.json` (hanya `GET` presigned & `PUT` upload + header
  `content-type`), diterapkan dengan
  `bunx wrangler r2 bucket cors set <R2_BUCKET_NAME> --file r2-cors.dev.json`.
  Origin produksi dibuat file terpisah setelah domain diputuskan.

## Modul

| Ekspor                            | Isi                                                                                           |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| `@bermula/storage/object-storage` | Tipe `ObjectStorage` (antarmuka netral provider)                                              |
| `@bermula/storage/r2-storage`     | `createR2Storage({ bucket, presigner })`: binding untuk put/get/head/delete                   |
| `@bermula/storage/r2-s3-storage`  | `createR2S3Storage(config)`: semua operasi lewat S3 API (dipakai `apps/api`)                  |
| `@bermula/storage/r2-presigner`   | `createR2Presigner(config)`: presigned URL S3 API (`allHeaders` menandatangani tipe & ukuran) |
| `@bermula/storage/object-key`     | `createObjectKey`, `sanitizeFileName`, `isObjectKeyOwnedBy`                                   |

- **Binding vs S3 API:** di `wrangler dev` binding R2 memakai bucket simulasi
  lokal, sedangkan presigned URL selalu ke bucket asli. Operasi yang harus
  melihat file hasil upload presigned (cek `complete`, hapus) memakai
  `createR2S3Storage`. Binding cocok untuk objek yang seluruhnya dikelola server.
- `wrangler.jsonc` di paket ini hanya untuk `wrangler types` dan test (R2 lokal),
  bukan Worker yang di-deploy.
- Klien wajib mengirim `content-type` dari `SignedUrl.headers` persis saat
  upload. `content-length` diisi otomatis oleh browser dari ukuran body (header
  terlarang untuk di-set manual), jadi file dengan ukuran lain ditolak R2.

## Testing

- Jalur binding diuji dengan `@cloudflare/vitest-plugin` (R2 lokal).
- Pembuatan presigned URL diuji secara deterministik: waktu disuntikkan,
  tanpa request jaringan. Jalur S3 API diuji dengan `fetch` palsu
  (`vi.stubGlobal`, dipulihkan otomatis lewat `unstubGlobals`).
