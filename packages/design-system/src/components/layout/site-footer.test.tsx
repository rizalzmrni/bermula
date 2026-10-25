import { APP_NAME } from "@bermula/core/brand";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { renderWithRouter } from "../../test-utils/render-with-router";
import { SiteFooter } from "./site-footer";

const SocialIcon = ({ className }: { className?: string }) => (
  <svg className={className} />
);

describe(SiteFooter, () => {
  afterEach(cleanup);

  it("shows the injected year with the app name", () => {
    renderWithRouter(<SiteFooter year={2030} />);
    expect(
      screen.getByText(`© 2030 ${APP_NAME}. Hak cipta dilindungi.`)
    ).toBeTruthy();
  });

  it("renders link groups under their headings", () => {
    renderWithRouter(
      <SiteFooter
        groups={[
          { items: [{ href: "/privasi", title: "Privasi" }], title: "Legal" },
        ]}
        year={2030}
      />
    );
    expect(screen.getByRole("heading", { name: "Legal" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Privasi" })).toBeTruthy();
  });

  it("labels icon-only social links with their title", () => {
    renderWithRouter(
      <SiteFooter
        socialLinks={[
          {
            external: true,
            href: "https://github.com",
            icon: SocialIcon,
            title: "GitHub",
          },
        ]}
        year={2030}
      />
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toBeTruthy();
  });
});
