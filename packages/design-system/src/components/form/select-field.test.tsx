import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SelectField } from "./select-field";

const OPTIONS = [
  { label: "Indonesia", value: "id" },
  { label: "Inggris", value: "en" },
];

describe(SelectField, () => {
  afterEach(cleanup);

  it("shows the placeholder when nothing is selected", () => {
    render(<SelectField label="Bahasa" options={OPTIONS} />);
    expect(
      screen.getByRole("combobox", { name: "Bahasa" }).textContent
    ).toContain("Pilih salah satu");
  });

  it("shows the label of the selected value, not the raw value", () => {
    render(<SelectField label="Bahasa" options={OPTIONS} value="en" />);
    const trigger = screen.getByRole("combobox", { name: "Bahasa" });
    expect(trigger.textContent).toContain("Inggris");
    expect(trigger.textContent).not.toContain("en");
  });

  it("lists the options and reports blur when the popup closes", async () => {
    const onBlur = vi.fn<() => void>();
    render(<SelectField label="Bahasa" onBlur={onBlur} options={OPTIONS} />);

    fireEvent.click(screen.getByRole("combobox", { name: "Bahasa" }));
    await expect(
      screen.findByRole("option", { name: "Indonesia" })
    ).resolves.toBeTruthy();
    expect(screen.getByRole("option", { name: "Inggris" })).toBeTruthy();

    fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
    await waitFor(() => expect(onBlur).toHaveBeenCalledOnce());
  });

  it("marks the trigger invalid when there are errors", () => {
    render(
      <SelectField
        errors={[{ message: "Wajib dipilih" }]}
        label="Bahasa"
        options={OPTIONS}
      />
    );
    expect(
      screen
        .getByRole("combobox", { name: "Bahasa" })
        .getAttribute("aria-invalid")
    ).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe("Wajib dipilih");
  });
});
