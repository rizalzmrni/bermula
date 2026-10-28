import { invitations } from "@bermula/db/schema/auth";
import { createTestDb } from "@bermula/db/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  insertMember,
  insertOrganization,
  insertUser,
} from "../testing/db-fixtures";
import {
  getOrganizationMembership,
  listMembers,
  listOrganizationInvitations,
  listUserInvitations,
  listUserOrganizations,
} from "./organizations";

const testDb = await createTestDb();
const { db } = testDb;

const NOW = new Date("2026-10-28T00:00:00Z");
const TOMORROW = new Date("2026-10-29T00:00:00Z");
const YESTERDAY = new Date("2026-10-27T00:00:00Z");

describe("organization queries", () => {
  let budi = { email: "", id: "" };
  let sari = { email: "", id: "" };
  let tokoId = "";
  let otherId = "";

  beforeAll(async () => {
    const owner = await insertUser(db, "Budi");
    const member = await insertUser(db, "Sari");
    budi = owner;
    sari = member;

    const toko = await insertOrganization(db, "Toko Budi");
    const other = await insertOrganization(db, "Toko Lain");
    const kafe = await insertOrganization(db, "Kafe Budi");
    tokoId = toko.id;
    otherId = other.id;

    await insertMember(db, {
      organizationId: toko.id,
      role: "owner",
      userId: owner.id,
    });
    await insertMember(db, {
      organizationId: kafe.id,
      role: "admin",
      userId: owner.id,
    });
    await insertMember(db, {
      organizationId: toko.id,
      role: "member",
      userId: member.id,
    });

    await db.insert(invitations).values([
      {
        email: "baru@example.com",
        expiresAt: TOMORROW,
        inviterId: owner.id,
        organizationId: toko.id,
        role: "admin",
      },
      {
        email: "lama@example.com",
        expiresAt: YESTERDAY,
        inviterId: owner.id,
        organizationId: toko.id,
        role: "member",
      },
      {
        email: "dijawab@example.com",
        expiresAt: TOMORROW,
        inviterId: owner.id,
        organizationId: toko.id,
        status: "accepted",
      },
      {
        email: member.email.toUpperCase(),
        expiresAt: TOMORROW,
        inviterId: owner.id,
        organizationId: other.id,
        role: null,
      },
    ]);
  });

  afterAll(() => testDb.close());

  it("returns the membership with the member's role", async () => {
    await expect(
      getOrganizationMembership({ db, organizationId: tokoId, userId: sari.id })
    ).resolves.toMatchObject({ id: tokoId, name: "Toko Budi", role: "member" });
  });

  it("answers 404 for an organization the user does not belong to", async () => {
    await expect(
      getOrganizationMembership({
        db,
        organizationId: otherId,
        userId: budi.id,
      })
    ).rejects.toMatchObject({ code: "ORGANIZATION_NOT_FOUND", status: 404 });
  });

  it("lists the user's organizations by name with their role", async () => {
    const rows = await listUserOrganizations({ db, userId: budi.id });

    expect(rows.map((row) => [row.name, row.role])).toStrictEqual([
      ["Kafe Budi", "admin"],
      ["Toko Budi", "owner"],
    ]);
  });

  it("lists members with their user profile", async () => {
    const rows = await listMembers({ db, organizationId: tokoId });

    expect(rows.map((row) => [row.name, row.email, row.role])).toStrictEqual([
      ["Budi", budi.email, "owner"],
      ["Sari", sari.email, "member"],
    ]);
  });

  it("lists only pending, unexpired invitations of the organization", async () => {
    const rows = await listOrganizationInvitations({
      db,
      now: NOW,
      organizationId: tokoId,
    });

    expect(rows.map((row) => [row.email, row.inviterName])).toStrictEqual([
      ["baru@example.com", "Budi"],
    ]);
  });

  it("matches the user's invitations case-insensitively", async () => {
    const rows = await listUserInvitations({ db, email: sari.email, now: NOW });

    expect(rows).toStrictEqual([
      expect.objectContaining({
        inviterName: "Budi",
        organizationName: "Toko Lain",
        role: null,
      }),
    ]);
  });

  it("hides invitations once they expire", async () => {
    const rows = await listUserInvitations({
      db,
      email: sari.email,
      now: new Date("2026-10-30T00:00:00Z"),
    });

    expect(rows).toStrictEqual([]);
  });
});
