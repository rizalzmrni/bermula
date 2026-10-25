import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { NavItem } from "../../lib/navigation";
import { renderWithRouter } from "../../test-utils/render-with-router";
import { MainNav } from "./main-nav";

const ITEMS: NavItem[] = [
  { href: "/harga", title: "Harga" },
  {
    href: "/produk",
    items: [{ href: "/produk/analitik", title: "Analitik" }],
    title: "Produk",
  },
];

describe(MainNav, () => {
  afterEach(cleanup);

  it("renders top-level items as links inside a labelled nav", () => {
    renderWithRouter(<MainNav items={ITEMS} />, { path: "/harga" });
    expect(
      screen.getByRole("navigation", { name: "Navigasi utama" })
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Harga" }).getAttribute("aria-current")
    ).toBe("page");
  });

  it("renders items with children as a dropdown trigger", () => {
    renderWithRouter(<MainNav items={ITEMS} />);
    expect(screen.getByRole("button", { name: "Produk" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Produk" })).toBeNull();
  });
});
