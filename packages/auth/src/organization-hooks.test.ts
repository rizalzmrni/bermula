import { describe, expect, it } from "vitest";

import {
  assertInvitableOrganization,
  validateNewOrganization,
  validateOrganizationUpdate,
} from "./organization-hooks";

describe(validateNewOrganization, () => {
  it("returns the trimmed name and slug", () => {
    expect(
      validateNewOrganization({ name: " Toko A ", slug: "toko-a" })
    ).toStrictEqual({
      name: "Toko A",
      slug: "toko-a",
    });
  });

  it("rejects a missing or malformed slug", () => {
    expect(() => validateNewOrganization({ name: "Toko A" })).toThrow(
      /expected string/u
    );
    expect(() =>
      validateNewOrganization({ name: "Toko A", slug: "Toko A" })
    ).toThrow(
      expect.objectContaining({
        body: expect.objectContaining({ code: "INVALID_ORGANIZATION_INPUT" }),
      })
    );
  });
});

describe(validateOrganizationUpdate, () => {
  it("validates only the fields that are sent", () => {
    expect(validateOrganizationUpdate({ name: " Baru " })).toStrictEqual({
      name: "Baru",
    });
    expect(() => validateOrganizationUpdate({ slug: "x" })).toThrow(
      "Alamat minimal 3 karakter."
    );
  });
});

describe(assertInvitableOrganization, () => {
  it("blocks invitations to a personal organization", () => {
    expect(() => assertInvitableOrganization({ isPersonal: true })).toThrow(
      "Personal organization cannot have other members"
    );
    expect(() =>
      assertInvitableOrganization({ isPersonal: false })
    ).not.toThrow();
  });
});
