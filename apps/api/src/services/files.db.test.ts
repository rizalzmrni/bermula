import { FILE_STATUS } from "@bermula/core/files";
import { files } from "@bermula/db/schema/storage";
import { createTestDb } from "@bermula/db/testing";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { insertOrganization, insertUser } from "../testing/db-fixtures";
import { createMemoryStorage } from "../testing/memory-storage";
import {
  completeUpload,
  createUpload,
  deleteFile,
  getDownloadUrl,
  listFiles,
} from "./files";
import type { FileScope } from "./files";

const testDb = await createTestDb();
const { db } = testDb;
const PNG = { contentType: "image/png", fileName: "foto.png", size: 2048 };

const setup = (scopeOverrides: Partial<FileScope> = {}) => {
  const memory = createMemoryStorage();
  const scope: FileScope = {
    db,
    kind: "image",
    organizationId: "",
    storage: memory.storage,
    ...scopeOverrides,
  };
  return { memory, scope };
};

describe("files service (PGlite)", () => {
  let organizationId = "";
  let otherOrganizationId = "";
  let uploaderId = "";
  let otherMemberId = "";

  beforeAll(async () => {
    const [organization, otherOrganization, uploader, otherMember] =
      await Promise.all([
        insertOrganization(db, "Tim A"),
        insertOrganization(db, "Tim B"),
        insertUser(db, "Pengunggah"),
        insertUser(db, "Anggota lain"),
      ]);
    organizationId = organization.id;
    otherOrganizationId = otherOrganization.id;
    uploaderId = uploader.id;
    otherMemberId = otherMember.id;
  });

  afterAll(() => testDb.close());

  const scoped = (overrides: Partial<FileScope> = {}) =>
    setup({ organizationId, ...overrides });

  /** Upload lengkap: baris `pending` → objek (ukuran & tipe sama) di storage. */
  const uploadImage = async (
    { memory, scope }: ReturnType<typeof setup>,
    fileName = "foto.png"
  ) => {
    const { file } = await createUpload({
      input: { ...PNG, fileName },
      scope,
      userId: uploaderId,
    });
    memory.seed(file.key, { contentType: PNG.contentType, size: PNG.size });
    return file;
  };

  describe(createUpload, () => {
    it("stores a pending row under the organization prefix", async () => {
      const { scope } = scoped();

      const { file, upload } = await createUpload({
        input: PNG,
        scope,
        userId: uploaderId,
      });

      expect(file).toMatchObject({
        kind: "image",
        organizationId,
        status: FILE_STATUS.pending,
        uploadedBy: uploaderId,
      });
      expect(file.key.startsWith(`images/${organizationId}/`)).toBeTruthy();
      expect(upload.headers).toStrictEqual({ "content-type": "image/png" });
    });

    it("rejects disallowed types without inserting a row", async () => {
      const { scope } = scoped();
      const before = await db.select().from(files);

      await expect(
        createUpload({
          input: { ...PNG, contentType: "image/svg+xml", fileName: "a.svg" },
          scope,
          userId: uploaderId,
        })
      ).rejects.toMatchObject({ status: 400 });
      await expect(db.select().from(files)).resolves.toHaveLength(
        before.length
      );
    });
  });

  describe(completeUpload, () => {
    it("refuses to complete before the object exists", async () => {
      const { scope } = scoped();
      const { file } = await createUpload({
        input: PNG,
        scope,
        userId: uploaderId,
      });

      await expect(
        completeUpload({ id: file.id, scope })
      ).rejects.toMatchObject({
        code: "UPLOAD_NOT_FOUND",
        status: 409,
      });
    });

    it("marks the file uploaded and stays idempotent", async () => {
      const upload = scoped();
      const { scope } = upload;
      const file = await uploadImage(upload);
      const now = new Date("2026-10-25T10:00:00.000Z");

      const first = await completeUpload({ id: file.id, now, scope });
      const second = await completeUpload({ id: file.id, scope });

      expect(first).toMatchObject({
        status: FILE_STATUS.uploaded,
        uploadedAt: now,
      });
      expect(second.uploadedAt).toStrictEqual(now);
    });

    it("drops the row and object when the stored object differs", async () => {
      const { memory, scope } = scoped();
      const { file } = await createUpload({
        input: PNG,
        scope,
        userId: uploaderId,
      });
      memory.seed(file.key, { contentType: "image/png", size: 1 });

      await expect(
        completeUpload({ id: file.id, scope })
      ).rejects.toMatchObject({
        code: "UPLOAD_MISMATCH",
      });
      expect(memory.keys()).toStrictEqual([]);
      await expect(
        db.select().from(files).where(eq(files.id, file.id))
      ).resolves.toHaveLength(0);
    });

    it("does not see files of another organization", async () => {
      const upload = scoped();
      const { scope } = upload;
      const file = await uploadImage(upload);

      await expect(
        completeUpload({
          id: file.id,
          scope: { ...scope, organizationId: otherOrganizationId },
        })
      ).rejects.toMatchObject({ code: "FILE_NOT_FOUND", status: 404 });
    });
  });

  describe(listFiles, () => {
    it("pages uploaded files of one organization and kind, newest first", async () => {
      // Organisasi sendiri agar file dari test lain tidak ikut terhitung.
      const isolated = await insertOrganization(db, "Tim daftar");
      const upload = setup({ organizationId: isolated.id });
      const { memory, scope } = upload;
      for (const name of ["1.png", "2.png", "3.png"]) {
        // Berurutan agar `created_at` (dan urutan halaman) dapat ditebak.
        // oxlint-disable-next-line no-await-in-loop
        const file = await uploadImage(upload, name);
        // oxlint-disable-next-line no-await-in-loop
        await completeUpload({ id: file.id, scope });
      }
      // File pending dan file jenis lain tidak boleh ikut terdaftar.
      await createUpload({ input: PNG, scope, userId: uploaderId });
      const documentScope: FileScope = { ...scope, kind: "document" };
      const pdf = { contentType: "application/pdf", size: 10 };
      const { file: document } = await createUpload({
        input: { ...pdf, fileName: "dok.pdf" },
        scope: documentScope,
        userId: uploaderId,
      });
      memory.seed(document.key, pdf);
      await completeUpload({ id: document.id, scope: documentScope });

      const first = await listFiles({ cursor: undefined, limit: 2, scope });
      const second = await listFiles({
        cursor: first.nextCursor ?? undefined,
        limit: 2,
        scope,
      });

      expect(first.items.map((file) => file.fileName)).toStrictEqual([
        "3.png",
        "2.png",
      ]);
      expect(second.items.map((file) => file.fileName)).toStrictEqual([
        "1.png",
      ]);
      expect(second.nextCursor).toBeNull();
    });
  });

  describe(getDownloadUrl, () => {
    it("only signs uploaded files", async () => {
      const { scope } = scoped();
      const { file } = await createUpload({
        input: PNG,
        scope,
        userId: uploaderId,
      });

      await expect(
        getDownloadUrl({ id: file.id, scope })
      ).rejects.toMatchObject({
        status: 404,
      });
    });
  });

  describe(deleteFile, () => {
    it("lets only the uploader or an organization admin delete", async () => {
      const upload = scoped();
      const { memory, scope } = upload;
      const file = await uploadImage(upload);
      await completeUpload({ id: file.id, scope });

      await expect(
        deleteFile({
          id: file.id,
          role: "member",
          scope,
          userId: otherMemberId,
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });

      await deleteFile({
        id: file.id,
        role: "member, admin",
        scope,
        userId: otherMemberId,
      });
      expect(memory.keys()).toStrictEqual([]);
      await expect(
        db.select().from(files).where(eq(files.id, file.id))
      ).resolves.toHaveLength(0);
    });
  });
});
