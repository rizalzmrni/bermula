import { describe, expect, it } from "vitest";

import { formatRole } from "./labels";

describe(formatRole, () => {
  it("translates built-in roles and joins multiple roles", () => {
    expect(formatRole("owner")).toBe("Pemilik");
    expect(formatRole("member, admin")).toBe("Anggota, Admin");
  });

  it("keeps a custom role as is", () => {
    expect(formatRole("billing")).toBe("billing");
  });
});
