import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PasswordField } from "./password-field";

describe(PasswordField, () => {
  afterEach(cleanup);

  it("hides the password until the toggle is pressed", () => {
    render(<PasswordField label="Kata sandi" />);
    const input = screen.getByLabelText("Kata sandi");
    expect(input.getAttribute("type")).toBe("password");

    const toggle = screen.getByRole("button", { name: "Tampilkan kata sandi" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggle);

    expect(input.getAttribute("type")).toBe("text");
    expect(
      screen
        .getByRole("button", { name: "Sembunyikan kata sandi" })
        .getAttribute("aria-pressed")
    ).toBe("true");
  });
});
