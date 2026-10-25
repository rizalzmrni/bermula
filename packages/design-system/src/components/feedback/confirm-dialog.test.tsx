import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "./confirm-dialog";

const openDialog = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Hapus proyek" }));
  return await screen.findByRole("alertdialog");
};

describe(ConfirmDialog, () => {
  afterEach(cleanup);

  it("opens from the trigger and closes after a successful confirm", async () => {
    const onConfirm = vi.fn<() => Promise<void>>().mockResolvedValue();
    render(
      <ConfirmDialog
        confirmLabel="Hapus"
        description="Tindakan ini tidak bisa dibatalkan."
        destructive
        onConfirm={onConfirm}
        title="Hapus proyek ini?"
        trigger={<button type="button">Hapus proyek</button>}
      />
    );

    const dialog = await openDialog();
    expect(dialog.textContent).toContain("Tindakan ini tidak bisa dibatalkan.");
    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("stays open and shows the error message when confirm fails", async () => {
    const onConfirm = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(new Error("network"));
    render(
      <ConfirmDialog
        confirmLabel="Hapus"
        onConfirm={onConfirm}
        title="Hapus proyek ini?"
        trigger={<button type="button">Hapus proyek</button>}
      />
    );

    await openDialog();
    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));

    await expect(screen.findByRole("alert")).resolves.toBeTruthy();
    expect(screen.getByRole("alert").textContent).toBe(
      "Tindakan gagal. Silakan coba lagi."
    );
    expect(screen.getByRole("alertdialog")).toBeTruthy();
  });

  it("cancels without confirming", async () => {
    const onConfirm = vi.fn<() => void>();
    render(
      <ConfirmDialog
        onConfirm={onConfirm}
        title="Hapus proyek ini?"
        trigger={<button type="button">Hapus proyek</button>}
      />
    );

    await openDialog();
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
