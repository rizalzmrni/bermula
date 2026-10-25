import { FILE_STATUS } from "@bermula/core/files";
import type { FileStatus } from "@bermula/core/files";
import { files } from "@bermula/db/schema/storage";
import { createTestDb } from "@bermula/db/testing";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { insertOrganization } from "../testing/db-fixtures";
import { createMemoryStorage } from "../testing/memory-storage";
import { CLEANUP_GRACE_MS, runStorageCleanup } from "./storage-cleanup";

const testDb = await createTestDb();
const { db } = testDb;

const NOW = new Date("2026-10-25T20:00:00.000Z");
const OLD = new Date(NOW.getTime() - CLEANUP_GRACE_MS - 1);
const FRESH = new Date(NOW.getTime() - 1000);

describe(runStorageCleanup, () => {
  let organizationId = "";

  beforeEach(async () => {
    await db.delete(files);
    const organization = await insertOrganization(db, "Tim cleanup");
    organizationId = organization.id;
  });

  afterAll(() => testDb.close());

  const insertFile = async (row: {
    key: string;
    status: FileStatus;
    createdAt: Date;
  }) => {
    await db.insert(files).values({
      contentType: "image/png",
      createdAt: row.createdAt,
      fileName: "a.png",
      key: row.key,
      kind: "image",
      organizationId,
      size: 1,
      status: row.status,
    });
  };

  it("removes stale pending uploads with their objects only", async () => {
    const memory = createMemoryStorage(OLD);
    const keys = {
      fresh: `images/${organizationId}/fresh.png`,
      stale: `images/${organizationId}/stale.png`,
      uploaded: `images/${organizationId}/uploaded.png`,
    };
    await insertFile({
      createdAt: OLD,
      key: keys.stale,
      status: FILE_STATUS.pending,
    });
    await insertFile({
      createdAt: FRESH,
      key: keys.fresh,
      status: FILE_STATUS.pending,
    });
    await insertFile({
      createdAt: OLD,
      key: keys.uploaded,
      status: FILE_STATUS.uploaded,
    });
    for (const key of Object.values(keys)) {
      memory.seed(key);
    }

    const result = await runStorageCleanup({
      db,
      now: NOW,
      storage: memory.storage,
    });
    const remaining = await db.select({ key: files.key }).from(files);

    expect(result).toStrictEqual({ orphanObjects: 0, pendingFiles: 1 });
    expect(remaining.map((row) => row.key).toSorted()).toStrictEqual(
      [keys.fresh, keys.uploaded].toSorted()
    );
    expect(memory.keys()).toStrictEqual([keys.fresh, keys.uploaded].toSorted());
  });

  it("sweeps old objects without a row under the upload prefixes", async () => {
    const memory = createMemoryStorage();
    const known = `documents/${organizationId}/known.pdf`;
    await db.insert(files).values({
      contentType: "application/pdf",
      fileName: "known.pdf",
      key: known,
      kind: "document",
      organizationId,
      size: 1,
      status: FILE_STATUS.uploaded,
    });
    memory.seed(known, { uploadedAt: OLD });
    memory.seed("documents/deleted-org/a.pdf", { uploadedAt: OLD });
    memory.seed("images/deleted-org/b.png", { uploadedAt: OLD });
    memory.seed("images/deleted-org/in-flight.png", { uploadedAt: FRESH });
    memory.seed("exports/other-feature.csv", { uploadedAt: OLD });

    const result = await runStorageCleanup({
      db,
      now: NOW,
      storage: memory.storage,
    });

    expect(result).toStrictEqual({ orphanObjects: 2, pendingFiles: 0 });
    expect(memory.keys()).toStrictEqual([
      known,
      "exports/other-feature.csv",
      "images/deleted-org/in-flight.png",
    ]);
  });

  it("is idempotent", async () => {
    const memory = createMemoryStorage();
    memory.seed("images/deleted-org/b.png", { uploadedAt: OLD });

    await runStorageCleanup({ db, now: NOW, storage: memory.storage });

    await expect(
      runStorageCleanup({ db, now: NOW, storage: memory.storage })
    ).resolves.toStrictEqual({ orphanObjects: 0, pendingFiles: 0 });
  });
});
