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

  it("submits a checked checkbox under its name in native form data", () => {
    const { container } = render(
      <form>
        <CheckboxField defaultChecked label="Ingat saya" name="remember" />
        <CheckboxField label="Langganan" name="newsletter" />
      </form>
    );
    const form = container.querySelector("form");
    if (!form) {
      throw new Error("form not rendered");
    }
    const formData = new FormData(form);
    expect(formData.get("remember")).toBe("on");
    expect(formData.has("newsletter")).toBeFalsy();
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
