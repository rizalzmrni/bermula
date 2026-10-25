import { FILE_STATUS } from "@bermula/core/files";
import type { Db } from "@bermula/db/client";
import { files } from "@bermula/db/schema/storage";
import type {
  ListedObject,
  ObjectStorage,
} from "@bermula/storage/object-storage";
import { and, eq, inArray, lt } from "drizzle-orm";

import { FILE_KIND_PATH } from "./files";

const MS_PER_HOUR = 60 * 60 * 1000;
/**
 * Umur minimum sebelum baris `pending` atau objek tanpa baris dianggap
 * ditinggalkan. Jauh di atas umur URL upload (10 menit), sehingga upload yang
 * sedang berjalan tidak pernah tersentuh.
 */
export const CLEANUP_GRACE_MS = 24 * MS_PER_HOUR;
// Membatasi kerja per jalan agar tetap di bawah batas subrequest & durasi
// invocation; sisanya dibereskan jalan berikutnya.
const MAX_PENDING_PER_RUN = 500;
const MAX_ORPHANS_PER_RUN = 500;

/** Hanya prefix milik fitur upload; objek lain di bucket tidak disentuh. */
export const CLEANUP_PREFIXES = Object.values(FILE_KIND_PATH).map(
  (path) => `${path}/`
);

export const cleanupCutoff = (now: Date) =>
  new Date(now.getTime() - CLEANUP_GRACE_MS);

/** Objek tanpa baris `storage_files` yang sudah melewati masa tenggang. */
export const findOrphanObjects = ({
  cutoff,
  knownKeys,
  objects,
}: {
  cutoff: Date;
  knownKeys: ReadonlySet<string>;
  objects: readonly ListedObject[];
}) =>
  objects.filter(
    (object) => !knownKeys.has(object.key) && object.uploadedAt < cutoff
  );

interface CleanupDeps {
  db: Db;
  storage: ObjectStorage;
  now: Date;
}

/**
 * Upload yang dimulai tapi tidak pernah di-`complete`. Baris dihapus lebih
 * dulu (hanya yang masih `pending`, agar tidak berebut dengan `complete`);
 * bila hapus objeknya gagal, objek itu menjadi yatim dan ikut tersapu
 * `deleteOrphanObjects` di jalan berikutnya.
 */
export const deleteStalePendingFiles = async ({
  db,
  now,
  storage,
}: CleanupDeps) => {
  const stale = db
    .select({ id: files.id })
    .from(files)
    .where(
      and(
        eq(files.status, FILE_STATUS.pending),
        lt(files.createdAt, cleanupCutoff(now))
      )
    )
    .limit(MAX_PENDING_PER_RUN);

  const deleted = await db
    .delete(files)
    .where(and(inArray(files.id, stale), eq(files.status, FILE_STATUS.pending)))
    .returning({ key: files.key });

  await Promise.all(deleted.map(({ key }) => storage.deleteObject(key)));
  return deleted.length;
};

const findKnownKeys = async (db: Db, keys: readonly string[]) => {
  if (keys.length === 0) {
    return new Set<string>();
  }
  const rows = await db
    .select({ key: files.key })
    .from(files)
    .where(inArray(files.key, [...keys]));
  return new Set(rows.map((row) => row.key));
};

const deleteOrphansInPrefix = async ({
  budget,
  db,
  now,
  prefix,
  storage,
}: CleanupDeps & { prefix: string; budget: number }) => {
  let deleted = 0;
  let cursor: string | undefined;
  do {
    // Halaman diproses berurutan: cursor berikutnya baru ada setelah listing.
    // oxlint-disable-next-line no-await-in-loop
    const page = await storage.listObjects({ cursor, prefix });
    // oxlint-disable-next-line no-await-in-loop
    const knownKeys = await findKnownKeys(
      db,
      page.objects.map((object) => object.key)
    );
    const orphans = findOrphanObjects({
      cutoff: cleanupCutoff(now),
      knownKeys,
      objects: page.objects,
    }).slice(0, budget - deleted);

    // oxlint-disable-next-line no-await-in-loop
    await Promise.all(orphans.map(({ key }) => storage.deleteObject(key)));
    deleted += orphans.length;
    ({ cursor } = page);
  } while (cursor !== undefined && deleted < budget);
  return deleted;
};

/**
 * Objek tanpa baris metadata: sisa organisasi yang dihapus (baris ter-cascade,
 * objek tertinggal) atau upload yang barisnya hilang. Objek seperti ini tidak
 * bisa diakses siapa pun, karena presigned URL hanya dibuat dari baris.
 */
export const deleteOrphanObjects = async (deps: CleanupDeps) => {
  let deleted = 0;
  for (const prefix of CLEANUP_PREFIXES) {
    // Berurutan agar kuota per jalan berlaku lintas prefix.
    // oxlint-disable-next-line no-await-in-loop
    deleted += await deleteOrphansInPrefix({
      ...deps,
      budget: MAX_ORPHANS_PER_RUN - deleted,
      prefix,
    });
    if (deleted >= MAX_ORPHANS_PER_RUN) {
      break;
    }
  }
  return deleted;
};

/** Dijalankan Cron Trigger harian (lihat `src/scheduled.ts`). */
export const runStorageCleanup = async (deps: CleanupDeps) => {
  // Baris pending lebih dulu: objeknya langsung dihapus di sini, bukan
  // menunggu sapuan yatim keesokan harinya.
  const pendingFiles = await deleteStalePendingFiles(deps);
  const orphanObjects = await deleteOrphanObjects(deps);
  return { orphanObjects, pendingFiles };
};
