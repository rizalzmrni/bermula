import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SubmitButton } from "./submit-button";

describe(SubmitButton, () => {
  afterEach(cleanup);

  it("is an enabled submit button by default", () => {
    render(<SubmitButton>Simpan</SubmitButton>);
    const button = screen.getByRole("button", { name: "Simpan" });
    expect(button.getAttribute("type")).toBe("submit");
    expect(button.hasAttribute("disabled")).toBeFalsy();
  });

  it("disables itself and shows the pending label while submitting", () => {
    render(
      <SubmitButton pending pendingLabel="Menyimpan…">
        Simpan
      </SubmitButton>
    );
    const button = screen.getByRole("button", { name: "Menyimpan…" });
    expect(button.hasAttribute("disabled")).toBeTruthy();
    expect(button.getAttribute("aria-busy")).toBe("true");
  });
});
