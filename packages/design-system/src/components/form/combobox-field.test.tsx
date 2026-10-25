import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ComboboxField } from "./combobox-field";

const OPTIONS = [
  { label: "Bandung", value: "bdg" },
  { label: "Jakarta", value: "jkt" },
  { label: "Surabaya", value: "sby" },
];

describe(ComboboxField, () => {
  afterEach(cleanup);

  it("shows the label of the selected value in the input", () => {
    render(<ComboboxField label="Kota" options={OPTIONS} value="jkt" />);
    expect(
      screen.getByRole<HTMLInputElement>("combobox", { name: "Kota" }).value
    ).toBe("Jakarta");
  });

  it("lists every option when opened from the keyboard", async () => {
    render(<ComboboxField label="Kota" options={OPTIONS} />);
    fireEvent.keyDown(screen.getByRole("combobox", { name: "Kota" }), {
      key: "ArrowDown",
    });

    await expect(
      screen.findByRole("option", { name: "Surabaya" })
    ).resolves.toBeTruthy();
    expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length);
  });
});
