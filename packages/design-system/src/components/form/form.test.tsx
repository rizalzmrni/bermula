import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CheckboxField } from "./checkbox-field";
import { ComboboxField } from "./combobox-field";
import { DatePickerField } from "./date-picker-field";
import { Form } from "./form";
import { OtpField } from "./otp-field";
import { PasswordField } from "./password-field";
import { RadioGroupField } from "./radio-group-field";
import { SelectField } from "./select-field";
import { SubmitButton } from "./submit-button";
import { TextField } from "./text-field";
import { TextareaField } from "./textarea-field";

const OPTIONS = [
  { label: "Bulanan", value: "monthly" },
  { label: "Tahunan", value: "yearly" },
];

const submit = () =>
  fireEvent.click(screen.getByRole("button", { name: "Kirim" }));

describe(Form, () => {
  afterEach(cleanup);

  it("blocks submit and shows browser messages for every empty required field", () => {
    const onFormSubmit = vi.fn<(values: Record<string, unknown>) => void>();
    render(
      <Form onFormSubmit={onFormSubmit}>
        <TextField label="Nama" name="name" required />
        <PasswordField label="Kata sandi" name="password" required />
        <TextareaField label="Catatan" name="note" required />
        <SelectField label="Paket" name="plan" options={OPTIONS} required />
        <ComboboxField label="Kota" name="city" options={OPTIONS} required />
        <RadioGroupField
          label="Tagihan"
          name="billing"
          options={OPTIONS}
          required
        />
        <DatePickerField label="Tanggal mulai" name="startDate" required />
        <OtpField label="Kode" length={4} name="code" required />
        <CheckboxField label="Saya setuju" name="terms" required />
        <SubmitButton>Kirim</SubmitButton>
      </Form>
    );

    submit();

    expect(onFormSubmit).not.toHaveBeenCalled();
    const alerts = screen.getAllByRole("alert");
    expect(alerts).toHaveLength(9);
    for (const alert of alerts) {
      expect(alert.textContent).not.toBe("");
    }
    expect(screen.getByLabelText("Nama").getAttribute("aria-invalid")).toBe(
      "true"
    );
    expect(document.activeElement).toBe(screen.getByLabelText("Nama"));
  });

  it("submits the values once constraints are met", () => {
    const onFormSubmit = vi.fn<(values: Record<string, unknown>) => void>();
    render(
      <Form onFormSubmit={onFormSubmit}>
        <TextField defaultValue="Rina" label="Nama" name="name" required />
        <RadioGroupField
          defaultValue="yearly"
          label="Tagihan"
          name="billing"
          options={OPTIONS}
          required
        />
        <DatePickerField
          defaultValue={new Date(2026, 9, 25)}
          label="Tanggal mulai"
          name="startDate"
          required
        />
        <OtpField
          defaultValue="1234"
          label="Kode"
          length={4}
          name="code"
          required
        />
        <SubmitButton>Kirim</SubmitButton>
      </Form>
    );

    submit();

    expect(onFormSubmit).toHaveBeenCalledOnce();
    expect(onFormSubmit.mock.calls[0]?.[0]).toMatchObject({
      billing: "yearly",
      code: "1234",
      name: "Rina",
      startDate: "2026-10-25",
    });
  });

  it("checks type and length constraints", () => {
    render(
      <Form>
        <TextField
          defaultValue="bukan-email"
          label="Email"
          name="email"
          type="email"
        />
        <TextField defaultValue="ab" label="Nama" minLength={3} name="name" />
        <SubmitButton>Kirim</SubmitButton>
      </Form>
    );

    submit();

    expect(screen.getByLabelText("Email").getAttribute("aria-invalid")).toBe(
      "true"
    );
    expect(screen.getByLabelText("Nama").getAttribute("aria-invalid")).toBe(
      "true"
    );
  });

  it("prefers external error messages over the browser message", () => {
    render(
      <Form>
        <TextField
          errors={[{ message: "Email sudah terdaftar" }]}
          label="Email"
          name="email"
          required
        />
        <SubmitButton>Kirim</SubmitButton>
      </Form>
    );

    submit();

    expect(screen.getByRole("alert").textContent).toBe("Email sudah terdaftar");
  });
});
