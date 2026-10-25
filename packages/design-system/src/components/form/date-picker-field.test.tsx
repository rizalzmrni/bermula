import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DatePickerField, toIsoDate } from "./date-picker-field";

describe(DatePickerField, () => {
  afterEach(cleanup);

  it("names the trigger by the label and the formatted date", () => {
    render(
      <DatePickerField
        label="Tanggal mulai"
        value={new Date(2026, 9, 25, 23, 30)}
      />
    );
    const trigger = screen.getByRole("button", { name: /Tanggal mulai/u });
    expect(trigger.textContent).toContain("25 Okt 2026");
  });

  it("shows the placeholder when empty", () => {
    render(<DatePickerField label="Tanggal mulai" />);
    expect(
      screen.getByRole("button", { name: /Tanggal mulai/u }).textContent
    ).toContain("Pilih tanggal");
  });

  it("picks a day from the calendar", async () => {
    const onValueChange = vi.fn<(date: Date | null) => void>();
    render(
      <DatePickerField
        defaultValue={new Date(2026, 9, 1)}
        label="Tanggal mulai"
        onValueChange={onValueChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Tanggal mulai/u }));
    fireEvent.click(await screen.findByRole("button", { name: /25 Oktober/u }));

    const picked = onValueChange.mock.calls[0]?.[0];
    expect(picked ? toIsoDate(picked) : null).toBe("2026-10-25");
  });
});

describe(toIsoDate, () => {
  it("uses local calendar fields and pads month and day", () => {
    expect(toIsoDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });
});
