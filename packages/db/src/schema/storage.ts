import { FILE_KIND, FILE_STATUS } from "@bermula/core/files";
import type { FileKind, FileStatus } from "@bermula/core/files";
import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  snakeCase,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { createdAt, id, updatedAt } from "../columns";
import { organizations } from "./auth";
import { users } from "./users";

const toSqlList = (values: readonly string[]) =>
  sql.raw(values.map((value) => `'${value}'`).join(", "));

/**
 * Metadata file di R2. Byte-nya ada di R2 dengan `key`; tabel ini sumber
 * kebenaran kepemilikan (organisasi) dan status upload.
 */
export const files = snakeCase.table(
  "storage_files",
  {
    id: id(),
    kind: text().$type<FileKind>().notNull(),
    key: text().notNull().unique(),
    /** Nama asli dari pengguna; key R2 memakai versi yang sudah disanitasi. */
    fileName: text().notNull(),
    contentType: text().notNull(),
    size: bigint({ mode: "number" }).notNull(),
    status: text().$type<FileStatus>().default(FILE_STATUS.pending).notNull(),
    organizationId: uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    /** Null bila akun pengunggah sudah dihapus; file tetap milik organisasi. */
    uploadedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    uploadedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    // Daftar file per organisasi & jenis, terbaru dulu (paginasi keyset).
    index("storage_files_organization_id_kind_created_at_idx").on(
      table.organizationId,
      table.kind,
      table.createdAt.desc(),
      table.id.desc()
    ),
    index("storage_files_uploaded_by_idx").on(table.uploadedBy),
    check(
      "storage_files_kind_check",
      sql`${table.kind} in (${toSqlList(Object.values(FILE_KIND))})`
    ),
    check(
      "storage_files_status_check",
      sql`${table.status} in (${toSqlList(Object.values(FILE_STATUS))})`
    ),
    check("storage_files_size_check", sql`${table.size} > 0`),
  ]
);

export type StoredFile = typeof files.$inferSelect;
