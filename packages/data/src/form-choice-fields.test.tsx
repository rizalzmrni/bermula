import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { formElementSubmit, useAppForm } from "./form";

const PLANS = [
  { label: "Gratis", value: "free" },
  { label: "Pro", value: "pro" },
];
const CITIES = [
  { label: "Jakarta", value: "jkt" },
  { label: "Surabaya", value: "sby" },
];
const BILLING = [
  { label: "Bulanan", value: "monthly" },
  { label: "Tahunan", value: "yearly" },
];

const subscriptionSchema = z.object({
  billing: z.string("Pilih siklus tagihan."),
  city: z.string("Pilih kota."),
  plan: z.string("Pilih paket."),
  startDate: z.date("Pilih tanggal mulai."),
});

type SubscriptionValues = z.input<typeof subscriptionSchema>;

interface SubscriptionFormProps {
  defaultValues: {
    [K in keyof SubscriptionValues]: SubscriptionValues[K] | null;
  };
  onValues?: (values: unknown) => void;
  submit: (form: HTMLFormElement) => Promise<unknown>;
}

const SubscriptionForm = ({
  defaultValues,
  onValues,
  submit,
}: SubscriptionFormProps) => {
  const form = useAppForm({
    defaultValues,
    validators: { onDynamic: subscriptionSchema },
    ...formElementSubmit(async (element) => {
      onValues?.(form.state.values);
      await submit(element);
    }),
  });

  return (
    <form.AppForm>
      <form.Form>
        <form.AppField name="plan">
          {(field) => <field.SelectField label="Paket" options={PLANS} />}
        </form.AppField>
        <form.AppField name="city">
          {(field) => <field.ComboboxField label="Kota" options={CITIES} />}
        </form.AppField>
        <form.AppField name="billing">
          {(field) => (
            <field.RadioGroupField label="Tagihan" options={BILLING} />
          )}
        </form.AppField>
        <form.AppField name="startDate">
          {(field) => <field.DatePickerField label="Tanggal mulai" />}
        </form.AppField>
        <form.SubmitButton>Kirim</form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
};

const EMPTY = { billing: null, city: null, plan: null, startDate: null };

const submitForm = () =>
  fireEvent.click(screen.getByRole("button", { name: "Kirim" }));

describe("choice and date fields bound to TanStack Form", () => {
  afterEach(cleanup);

  it("shows a schema error under every empty field and does not submit", async () => {
    const submit = vi.fn<(form: HTMLFormElement) => Promise<unknown>>();
    render(<SubscriptionForm defaultValues={EMPTY} submit={submit} />);

    submitForm();

    await screen.findByText("Pilih paket.");
    expect(
      screen.getAllByRole("alert").map((alert) => alert.textContent)
    ).toStrictEqual([
      "Pilih paket.",
      "Pilih kota.",
      "Pilih siklus tagihan.",
      "Pilih tanggal mulai.",
    ]);
    expect(
      screen
        .getByRole("combobox", { name: "Paket" })
        .getAttribute("aria-invalid")
    ).toBe("true");
    expect(submit).not.toHaveBeenCalled();
  });

  it("shows the select value from form state and posts it as a string", () => {
    render(
      <SubscriptionForm
        defaultValues={{ ...EMPTY, plan: "pro" }}
        submit={vi.fn<(form: HTMLFormElement) => Promise<unknown>>()}
      />
    );

    const trigger = screen.getByRole("combobox", { name: "Paket" });
    expect(trigger.textContent).toContain("Pro");
    const form = trigger.closest("form");
    expect(form ? new FormData(form).get("plan") : null).toBe("pro");
  });

  // Base UI Select tidak bisa dipilih lewat event sintetis di happy-dom;
  // nilainya di sini datang dari state form (lihat test di atas), sedangkan
  // combobox, radio, dan tanggal dipilih lewat UI.
  it("keeps typed values in state and posts strings with the form element", async () => {
    const submit = vi.fn<(form: HTMLFormElement) => Promise<unknown>>(() =>
      Promise.resolve()
    );
    const onValues = vi.fn<(values: unknown) => void>();
    render(
      <SubscriptionForm
        defaultValues={{
          ...EMPTY,
          plan: "pro",
          startDate: new Date(2026, 9, 1),
        }}
        onValues={onValues}
        submit={submit}
      />
    );

    fireEvent.keyDown(screen.getByRole("combobox", { name: "Kota" }), {
      key: "ArrowDown",
    });
    fireEvent.click(await screen.findByRole("option", { name: "Surabaya" }));

    fireEvent.click(screen.getByText("Tahunan"));

    fireEvent.click(screen.getByRole("button", { name: /Tanggal mulai/u }));
    fireEvent.click(await screen.findByRole("button", { name: /25 Oktober/u }));

    submitForm();

    await waitFor(() => {
      expect(submit).toHaveBeenCalledOnce();
    });
    expect(onValues).toHaveBeenCalledWith({
      billing: "yearly",
      city: "sby",
      plan: "pro",
      startDate: new Date(2026, 9, 25),
    });
    const formData = new FormData(submit.mock.calls[0]?.[0]);
    expect(Object.fromEntries(formData)).toMatchObject({
      billing: "yearly",
      city: "sby",
      plan: "pro",
      startDate: "2026-10-25",
    });
  });
});
