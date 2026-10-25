import { createTestDb } from "@bermula/db/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  insertMember,
  insertOrganization,
  insertUser,
} from "../testing/db-fixtures";
import { getActiveMembership } from "./account";

const testDb = await createTestDb();
const { db } = testDb;

describe(getActiveMembership, () => {
  let userId = "";
  let organizationId = "";
  let otherOrganizationId = "";

  beforeAll(async () => {
    const user = await insertUser(db, "Budi");
    const organization = await insertOrganization(db, "Tim Budi");
    const other = await insertOrganization(db, "Tim Lain");
    await insertMember(db, {
      organizationId: organization.id,
      role: "admin",
      userId: user.id,
    });
    userId = user.id;
    organizationId = organization.id;
    otherOrganizationId = other.id;
  });

  afterAll(() => testDb.close());

  it("returns the organization with the member's role", async () => {
    await expect(
      getActiveMembership({ db, organizationId, userId })
    ).resolves.toMatchObject({
      id: organizationId,
      isPersonal: false,
      name: "Tim Budi",
      role: "admin",
    });
  });

  it("rejects an organization the user does not belong to", async () => {
    await expect(
      getActiveMembership({ db, organizationId: otherOrganizationId, userId })
    ).rejects.toMatchObject({ code: "NOT_A_MEMBER", status: 403 });
  });
});
