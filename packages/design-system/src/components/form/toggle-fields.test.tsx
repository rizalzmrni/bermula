import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CheckboxField } from "./checkbox-field";
import { SwitchField } from "./switch-field";

describe("checkbox and switch fields", () => {
  afterEach(cleanup);

  it("toggles the checkbox from its label", () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();
    render(
      <CheckboxField
        label="Saya setuju dengan syarat layanan"
        onCheckedChange={onCheckedChange}
      />
    );
    fireEvent.click(screen.getByText("Saya setuju dengan syarat layanan"));
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("shows checkbox errors", () => {
    render(
      <CheckboxField
        errors={[{ message: "Harus disetujui" }]}
        label="Saya setuju"
      />
    );
    expect(
      screen
        .getByRole("checkbox", { name: "Saya setuju" })
        .getAttribute("aria-invalid")
    ).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe("Harus disetujui");
  });

  it("names the switch by its label", () => {
    render(<SwitchField defaultChecked label="Notifikasi email" />);
    const control = screen.getByRole("switch", { name: "Notifikasi email" });
    expect(control.getAttribute("aria-checked")).toBe("true");
  });
});
