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

  it("submits the whole code under its name in native form data", () => {
    const { container } = render(
      <form>
        <OtpField defaultValue="123456" label="Kode" name="code" />
      </form>
    );
    const form = container.querySelector("form");
    if (!form) {
      throw new Error("form not rendered");
    }
    expect(new FormData(form).get("code")).toBe("123456");
  });
});
