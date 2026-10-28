import { describe, expect, it } from "vitest";

import { getInitials } from "./initials";

describe(getInitials, () => {
  it("takes the first letter of up to two words", () => {
    expect(getInitials("toko budi jaya")).toBe("TB");
    expect(getInitials("Sari")).toBe("S");
  });
});
