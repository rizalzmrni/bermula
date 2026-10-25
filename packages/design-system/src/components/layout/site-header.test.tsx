import { APP_NAME } from "@bermula/core/brand";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { renderWithRouter } from "../../test-utils/render-with-router";
import { SiteHeader } from "./site-header";

describe(SiteHeader, () => {
  afterEach(cleanup);

  it("renders the logo, navigation, actions, and theme toggle", () => {
    renderWithRouter(
      <SiteHeader
        actions={<button type="button">Masuk</button>}
        items={[{ href: "/harga", title: "Harga" }]}
      />
    );
    expect(screen.getByRole("link", { name: APP_NAME })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Harga" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Masuk" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ganti tema" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Buka menu navigasi" })
    ).toBeTruthy();
  });

  it("can hide the theme toggle", () => {
    renderWithRouter(<SiteHeader items={[]} showThemeToggle={false} />);
    expect(screen.queryByRole("button", { name: "Ganti tema" })).toBeNull();
  });
});
