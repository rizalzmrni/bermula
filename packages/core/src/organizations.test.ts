import { describe, expect, it } from "vitest";

import {
  hasOrganizationRole,
  inviteMemberSchema,
  isOrganizationManager,
  isOrganizationOwner,
  organizationInputSchema,
  organizationSlugSchema,
  toOrganizationSlug,
} from "./organizations";

describe(toOrganizationSlug, () => {
  it("lowercases, strips accents, and joins words with dashes", () => {
    expect(toOrganizationSlug("Toko Ánda & Co.")).toBe("toko-anda-co");
  });

  it("trims leading and trailing separators", () => {
    expect(toOrganizationSlug("  --Halo Dunia!--  ")).toBe("halo-dunia");
  });

  it("caps the length without leaving a trailing dash", () => {
    const slug = toOrganizationSlug(`${"a".repeat(47)} b`);

    expect(slug).toBe("a".repeat(47));
    expect(organizationSlugSchema.safeParse(slug).success).toBeTruthy();
  });

  it("returns an empty string when nothing usable is left", () => {
    expect(toOrganizationSlug("!!!")).toBe("");
  });
});

describe("organization slug rules", () => {
  it.each(["toko-a", "abc", "tim-2026"])("accepts %s", (slug) => {
    expect(organizationSlugSchema.safeParse(slug).success).toBeTruthy();
  });

  it.each(["ab", "Toko-A", "toko--a", "-toko", "toko-", "toko a", "toko_a"])(
    "rejects %s",
    (slug) => {
      expect(organizationSlugSchema.safeParse(slug).success).toBeFalsy();
    }
  );
});

describe("organization input", () => {
  it("trims the name and rejects an empty one", () => {
    expect(
      organizationInputSchema.parse({ name: "  Toko A ", slug: "toko-a" })
    ).toStrictEqual({ name: "Toko A", slug: "toko-a" });
    expect(
      organizationInputSchema.safeParse({ name: "   ", slug: "toko-a" }).success
    ).toBeFalsy();
  });
});

describe("member invitation input", () => {
  it("normalizes the email and only allows assignable roles", () => {
    expect(
      inviteMemberSchema.parse({ email: " Budi@Example.com ", role: "admin" })
    ).toStrictEqual({ email: "budi@example.com", role: "admin" });
    expect(
      inviteMemberSchema.safeParse({ email: "budi@example.com", role: "owner" })
        .success
    ).toBeFalsy();
  });
});

describe(hasOrganizationRole, () => {
  it("matches any role in a comma separated list", () => {
    expect(
      hasOrganizationRole("member, admin", new Set(["admin"]))
    ).toBeTruthy();
    expect(hasOrganizationRole("member", new Set(["admin"]))).toBeFalsy();
  });

  it("derives manager and owner checks", () => {
    expect(isOrganizationManager("admin")).toBeTruthy();
    expect(isOrganizationManager("member")).toBeFalsy();
    expect(isOrganizationOwner("owner")).toBeTruthy();
    expect(isOrganizationOwner("admin")).toBeFalsy();
  });
});
