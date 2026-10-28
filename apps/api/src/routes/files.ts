import {
  FILE_KIND,
  FILE_STATUS,
  UPLOAD_POLICIES,
  uploadRequestSchema,
} from "@bermula/core/files";
import type { FileKind } from "@bermula/core/files";
import { createRoute, z } from "@hono/zod-openapi";

import { errorResponse } from "../lib/errors";
import {
  ORGANIZATION_PATH,
  OrganizationParamsSchema,
} from "../lib/organization-params";
import { createRouter } from "../lib/router";
import { requireOrganizationMember } from "../middleware/require-organization-member";
import { SESSION_SECURITY } from "../openapi";
import {
  FILE_KIND_PATH,
  completeUpload,
  createUpload,
  deleteFile,
  getDownloadUrl,
  listFiles,
  toFileResponse,
} from "../services/files";
import type { FileScope } from "../services/files";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const FileSchema = z
  .object({
    contentType: z.string().openapi({ example: "image/png" }),
    createdAt: z.iso.datetime(),
    fileName: z.string().openapi({ example: "Foto Profil.png" }),
    id: z.uuid(),
    kind: z.enum([FILE_KIND.image, FILE_KIND.document]),
    size: z.int().openapi({ description: "Ukuran dalam byte.", example: 2048 }),
    status: z.enum([FILE_STATUS.pending, FILE_STATUS.uploaded]),
    uploadedAt: z.iso.datetime().nullable(),
    uploadedBy: z.uuid().nullable().openapi({
      description: "Null bila akun pengunggah sudah dihapus.",
    }),
  })
  .openapi("File");

const UploadRequestSchema = uploadRequestSchema
  .extend({
    contentType: uploadRequestSchema.shape.contentType.openapi({
      example: "image/png",
    }),
    fileName: uploadRequestSchema.shape.fileName.openapi({
      example: "Foto Profil.png",
    }),
    size: uploadRequestSchema.shape.size.openapi({
      description: "Ukuran persis dalam byte (`File.size` di browser).",
      example: 2048,
    }),
  })
  .openapi("UploadRequest");

const UploadSchema = z
  .object({
    file: FileSchema,
    upload: z.object({
      expiresAt: z.iso.datetime(),
      headers: z.record(z.string(), z.string()).openapi({
        description:
          "Kirim `content-type` persis seperti ini; `content-length` diisi browser dari ukuran file.",
        example: { "content-length": "2048", "content-type": "image/png" },
      }),
      method: z.literal("PUT"),
      url: z.url(),
    }),
  })
  .openapi("FileUpload");

const FilePageSchema = z
  .object({
    items: z.array(FileSchema),
    nextCursor: z.uuid().nullable().openapi({
      description: "Kirim sebagai `cursor` untuk halaman berikutnya.",
    }),
  })
  .openapi("FilePage");

const DownloadSchema = z
  .object({ expiresAt: z.iso.datetime(), url: z.url() })
  .openapi("FileDownload");

const FileParamsSchema = OrganizationParamsSchema.extend({
  id: z.uuid().openapi({ param: { in: "path", name: "id" } }),
});

const ListQuerySchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
});

const COMMON_ERRORS = {
  401: errorResponse("Belum login."),
  404: errorResponse("Organisasi tidak ditemukan atau bukan anggotanya."),
  429: errorResponse("Terlalu banyak permintaan."),
};

const TAGS = {
  document: "Documents",
  image: "Images",
} as const satisfies Record<FileKind, string>;

const toPolicyDescription = (kind: FileKind) => {
  const policy = UPLOAD_POLICIES[kind];
  return `Maksimal ${policy.maxSize} byte; tipe: ${policy.allowedContentTypes.join(", ")}.`;
};

/**
 * Route satu jenis file (`.../images` atau `.../documents` di bawah path
 * organisasi). Keduanya berbagi
 * service & tabel, tetapi kebijakan, prefix R2, dan dokumentasinya terpisah.
 */
const createFileRoutes = <K extends FileKind>(kind: K) => {
  const base =
    `${ORGANIZATION_PATH}/${FILE_KIND_PATH[kind]}` as `${typeof ORGANIZATION_PATH}/${(typeof FILE_KIND_PATH)[K]}`;
  const tags: string[] = [TAGS[kind]];
  const shared = {
    security: SESSION_SECURITY,
    tags,
  };

  const createUploadRoute = createRoute({
    ...shared,
    description: `Langkah 1: simpan metadata dan dapatkan presigned URL. Klien lalu mengirim file dengan \`PUT\` ke \`upload.url\`, kemudian memanggil \`/complete\`. ${toPolicyDescription(kind)}`,
    method: "post",
    middleware: [requireOrganizationMember] as const,
    path: base,
    request: {
      body: {
        content: { "application/json": { schema: UploadRequestSchema } },
        required: true,
      },
      params: OrganizationParamsSchema,
    },
    responses: {
      201: {
        content: { "application/json": { schema: UploadSchema } },
        description: "Baris `pending` dibuat; unggah file ke `upload.url`.",
      },
      400: errorResponse(
        "Input tidak valid, tipe tidak didukung (`UNSUPPORTED_TYPE`), atau terlalu besar (`FILE_TOO_LARGE`)."
      ),
      ...COMMON_ERRORS,
    },
    summary: "Mulai upload",
  });

  const completeUploadRoute = createRoute({
    ...shared,
    description:
      "Langkah 2: memastikan file sudah ada di penyimpanan dengan ukuran & tipe yang sama. Aman dipanggil ulang.",
    method: "post",
    middleware: [requireOrganizationMember] as const,
    path: `${base}/{id}/complete`,
    request: { params: FileParamsSchema },
    responses: {
      ...COMMON_ERRORS,
      200: {
        content: { "application/json": { schema: FileSchema } },
        description: "File berstatus `uploaded`.",
      },
      404: errorResponse("Organisasi atau file tidak ditemukan."),
      409: errorResponse(
        "File belum diunggah (`UPLOAD_NOT_FOUND`) atau tidak sesuai (`UPLOAD_MISMATCH`)."
      ),
    },
    summary: "Selesaikan upload",
  });

  const listRoute = createRoute({
    ...shared,
    description: "File berstatus `uploaded` milik organisasi, terbaru dulu.",
    method: "get",
    middleware: [requireOrganizationMember] as const,
    path: base,
    request: { params: OrganizationParamsSchema, query: ListQuerySchema },
    responses: {
      200: {
        content: { "application/json": { schema: FilePageSchema } },
        description: "Satu halaman file.",
      },
      ...COMMON_ERRORS,
    },
    summary: "Daftar file",
  });

  const downloadRoute = createRoute({
    ...shared,
    description:
      kind === FILE_KIND.image
        ? "Presigned URL berumur 5 menit; ditampilkan inline (bisa dipakai di `<img>`)."
        : "Presigned URL berumur 5 menit; browser mengunduh dengan nama asli file.",
    method: "get",
    middleware: [requireOrganizationMember] as const,
    path: `${base}/{id}/download`,
    request: { params: FileParamsSchema },
    responses: {
      200: {
        content: { "application/json": { schema: DownloadSchema } },
        description: "URL unduhan.",
      },
      ...COMMON_ERRORS,
      404: errorResponse("Organisasi atau file tidak ditemukan."),
    },
    summary: "URL unduhan",
  });

  const deleteRoute = createRoute({
    ...shared,
    description: "Hanya pengunggah atau owner/admin organisasi.",
    method: "delete",
    middleware: [requireOrganizationMember] as const,
    path: `${base}/{id}`,
    request: { params: FileParamsSchema },
    responses: {
      204: { description: "File dihapus." },
      401: COMMON_ERRORS[401],
      403: errorResponse("Tidak berhak menghapus file ini."),
      404: errorResponse("Organisasi atau file tidak ditemukan."),
      429: COMMON_ERRORS[429],
    },
    summary: "Hapus file",
  });

  const toScope = (c: {
    var: Pick<FileScope, "db" | "storage" | "organizationId">;
  }): FileScope => ({
    db: c.var.db,
    kind,
    organizationId: c.var.organizationId,
    storage: c.var.storage,
  });

  return createRouter()
    .openapi(createUploadRoute, async (c) => {
      const { file, upload } = await createUpload({
        input: c.req.valid("json"),
        scope: toScope(c),
        userId: c.var.user.id,
      });
      return c.json(
        {
          file: toFileResponse(file),
          upload: {
            expiresAt: upload.expiresAt.toISOString(),
            headers: upload.headers,
            method: "PUT" as const,
            url: upload.url,
          },
        },
        201
      );
    })
    .openapi(completeUploadRoute, async (c) => {
      const file = await completeUpload({
        id: c.req.valid("param").id,
        scope: toScope(c),
      });
      return c.json(toFileResponse(file), 200);
    })
    .openapi(listRoute, async (c) => {
      const { cursor, limit } = c.req.valid("query");
      const page = await listFiles({ cursor, limit, scope: toScope(c) });
      return c.json(
        {
          items: page.items.map(toFileResponse),
          nextCursor: page.nextCursor,
        },
        200
      );
    })
    .openapi(downloadRoute, async (c) => {
      const download = await getDownloadUrl({
        id: c.req.valid("param").id,
        scope: toScope(c),
      });
      return c.json(
        { expiresAt: download.expiresAt.toISOString(), url: download.url },
        200
      );
    })
    .openapi(deleteRoute, async (c) => {
      await deleteFile({
        id: c.req.valid("param").id,
        role: c.var.membership.role,
        scope: toScope(c),
        userId: c.var.user.id,
      });
      return c.body(null, 204);
    });
};

export const imageRoutes = createFileRoutes(FILE_KIND.image);
export const documentRoutes = createFileRoutes(FILE_KIND.document);
