import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { NavItem } from "../../lib/navigation";
import { renderWithRouter } from "../../test-utils/render-with-router";
import { MobileNav } from "./mobile-nav";

const ITEMS: NavItem[] = [
  { href: "/harga", title: "Harga" },
  {
    href: "/produk",
    items: [{ href: "/produk/analitik", title: "Analitik" }],
    title: "Produk",
  },
];

const openMenu = () =>
  fireEvent.click(screen.getByRole("button", { name: "Buka menu navigasi" }));

describe(MobileNav, () => {
  afterEach(cleanup);

  it("lists top-level and nested items after opening", async () => {
    renderWithRouter(<MobileNav items={ITEMS} />);
    expect(screen.queryByRole("link", { name: "Harga" })).toBeNull();

    openMenu();

    await expect(
      screen.findByRole("link", { name: "Harga" })
    ).resolves.toBeTruthy();
    expect(screen.getByRole("link", { name: "Analitik" })).toBeTruthy();
    expect(screen.getByText("Produk")).toBeTruthy();
  });

  it("closes after a link is chosen", async () => {
    renderWithRouter(<MobileNav items={ITEMS} />);
    openMenu();

    fireEvent.click(await screen.findByRole("link", { name: "Harga" }));

    await waitFor(() =>
      expect(screen.queryByRole("link", { name: "Harga" })).toBeNull()
    );
  });
});
