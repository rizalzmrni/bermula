import { describe, expect, it } from "vitest";

import { fontLinks } from "./font";

const findLink = (rel: string, href: string) =>
  fontLinks.find(
    (link) =>
      "rel" in link && link.rel === rel && "href" in link && link.href === href
  );

describe("font links", () => {
  it("loads the Outfit stylesheet used by --font-sans", () => {
    const stylesheet = fontLinks.find(
      (link) => "rel" in link && link.rel === "stylesheet"
    );
    const href = stylesheet && "href" in stylesheet ? stylesheet.href : "";
    expect(href).toContain("family=Outfit");
  });

  it("preconnects to the font file origin with CORS", () => {
    const preconnect = findLink("preconnect", "https://fonts.gstatic.com");
    const crossOrigin =
      preconnect && "crossOrigin" in preconnect ? preconnect.crossOrigin : null;
    expect(crossOrigin).toBe("anonymous");
  });
});
