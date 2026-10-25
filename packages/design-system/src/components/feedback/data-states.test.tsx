import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { LoadingSkeleton } from "./loading-skeleton";

describe("data state components", () => {
  afterEach(cleanup);

  it("renders the empty state with its next action", () => {
    render(
      <EmptyState
        action={<button type="button">Buat proyek</button>}
        description="Proyek yang Anda buat akan tampil di sini."
        title="Belum ada proyek"
      />
    );
    expect(screen.getByText("Belum ada proyek")).toBeTruthy();
    expect(
      screen.getByText("Proyek yang Anda buat akan tampil di sini.")
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Buat proyek" })).toBeTruthy();
  });

  it("announces the error state and retries", () => {
    const onRetry = vi.fn<() => void>();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByRole("alert").textContent).toContain(
      "Gagal memuat data"
    );
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("disables retry while retrying and hides it without a handler", () => {
    const { rerender } = render(
      <ErrorState onRetry={vi.fn<() => void>()} retrying />
    );
    const button = screen.getByRole<HTMLButtonElement>("button", {
      name: "Coba lagi",
    });
    expect(button.disabled).toBeTruthy();
    expect(button.getAttribute("aria-busy")).toBe("true");

    rerender(<ErrorState />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("announces loading and renders one placeholder row per item", () => {
    const { container } = render(
      <LoadingSkeleton label="Memuat proyek…" rows={5} />
    );
    expect(screen.getByRole("status").textContent).toBe("Memuat proyek…");
    expect(
      container.querySelectorAll('[data-slot="skeleton"].rounded-full')
    ).toHaveLength(5);
  });

  it("renders a header row plus data rows for the table variant", () => {
    const { container } = render(
      <LoadingSkeleton columns={3} rows={2} variant="table" />
    );
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      9
    );
  });
});
