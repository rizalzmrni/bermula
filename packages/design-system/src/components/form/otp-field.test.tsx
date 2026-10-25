import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { OtpField } from "./otp-field";

describe(OtpField, () => {
  afterEach(cleanup);

  it("renders one labelled input per character", () => {
    render(<OtpField label="Kode verifikasi" length={4} />);
    const slots = screen.getAllByRole("textbox");
    expect(slots).toHaveLength(4);
    expect(screen.getByRole("textbox", { name: "Kode verifikasi" })).toBe(
      slots[0]
    );
    expect(screen.getByRole("textbox", { name: "Karakter 4 dari 4" })).toBe(
      slots[3]
    );
  });
});
