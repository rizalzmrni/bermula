import { IconHome, IconSettings } from "@tabler/icons-react";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { NavGroup } from "../../lib/navigation";
import { renderWithRouter } from "../../test-utils/render-with-router";
import { AppShell } from "./app-shell";

const GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/", icon: IconHome, title: "Beranda" },
      {
        href: "/pengaturan",
        icon: IconSettings,
        items: [
          { href: "/pengaturan/profil", title: "Profil" },
          { href: "/pengaturan/tagihan", title: "Tagihan" },
        ],
        title: "Pengaturan",
      },
    ],
    title: "Menu",
  },
];

const isActive = (name: string) =>
  screen.getByRole("link", { name }).dataset.active !== undefined;

describe(AppShell, () => {
  afterEach(cleanup);

  it("renders the sidebar groups, header slots, and content", () => {
    renderWithRouter(
      <AppShell
        actions={<button type="button">Notifikasi</button>}
        groups={GROUPS}
        title={<h1>Dasbor</h1>}
      >
        <p>Isi halaman</p>
      </AppShell>
    );
    expect(screen.getByText("Menu")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Profil" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Dasbor" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Notifikasi" })).toBeTruthy();
    expect(screen.getByText("Isi halaman")).toBeTruthy();
  });

  it("marks the current route and its parent active, but not home", () => {
    renderWithRouter(
      <AppShell groups={GROUPS}>
        <p>Isi</p>
      </AppShell>,
      { path: "/pengaturan/profil" }
    );
    expect(isActive("Pengaturan")).toBeTruthy();
    expect(isActive("Profil")).toBeTruthy();
    expect(isActive("Tagihan")).toBeFalsy();
    expect(isActive("Beranda")).toBeFalsy();
  });

  it("collapses the sidebar from the header trigger", () => {
    const { container } = renderWithRouter(
      <AppShell groups={GROUPS}>
        <p>Isi</p>
      </AppShell>
    );
    const sidebar = () =>
      container.querySelector<HTMLElement>('[data-slot="sidebar"]');
    expect(sidebar()?.dataset.state).toBe("expanded");

    const [trigger] = screen.getAllByRole("button", {
      name: "Buka/tutup sidebar",
    });
    if (!trigger) {
      throw new Error("sidebar trigger not found");
    }
    fireEvent.click(trigger);
    expect(sidebar()?.dataset.state).toBe("collapsed");
  });
});
