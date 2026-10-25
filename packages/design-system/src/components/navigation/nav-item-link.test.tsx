import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { renderWithRouter } from "../../test-utils/render-with-router";
import { NavItemLink } from "./nav-item-link";

describe(NavItemLink, () => {
  afterEach(cleanup);

  it("marks the internal link for the current route as the current page", () => {
    renderWithRouter(
      <>
        <NavItemLink item={{ href: "/harga", title: "Harga" }} />
        <NavItemLink item={{ href: "/blog", title: "Blog" }} />
      </>,
      { path: "/harga" }
    );
    expect(
      screen.getByRole("link", { name: "Harga" }).getAttribute("aria-current")
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: "Blog" }).getAttribute("aria-current")
    ).toBeNull();
  });

  it("only marks the home link on the home route", () => {
    renderWithRouter(<NavItemLink item={{ href: "/", title: "Beranda" }} />, {
      path: "/harga",
    });
    expect(
      screen.getByRole("link", { name: "Beranda" }).getAttribute("aria-current")
    ).toBeNull();
  });

  it("opens external links in a new tab without leaking the opener", () => {
    renderWithRouter(
      <NavItemLink
        item={{ external: true, href: "https://github.com", title: "GitHub" }}
      />
    );
    const link = screen.getByRole("link", { name: "GitHub" });
    expect(link.getAttribute("href")).toBe("https://github.com");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
