import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RadioGroupField } from "./radio-group-field";

const OPTIONS = [
  { label: "Bulanan", value: "monthly" },
  { label: "Tahunan", value: "yearly" },
];

describe(RadioGroupField, () => {
  afterEach(cleanup);

  it("names the group by its label and each radio by its option", () => {
    render(<RadioGroupField label="Tagihan" options={OPTIONS} />);
    expect(screen.getByRole("radiogroup", { name: "Tagihan" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Bulanan" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Tahunan" })).toBeTruthy();
  });

  it("reports the chosen value", () => {
    const onValueChange = vi.fn<(value: string) => void>();
    render(
      <RadioGroupField
        label="Tagihan"
        onValueChange={onValueChange}
        options={OPTIONS}
      />
    );
    fireEvent.click(screen.getByText("Tahunan"));
    expect(onValueChange).toHaveBeenCalledWith("yearly");
  });
});
