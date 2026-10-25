import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TailwindIndicator } from "./tailwind-indicator";

describe(TailwindIndicator, () => {
  afterEach(cleanup);

  it("renders nothing by default", () => {
    const { container } = render(<TailwindIndicator />);
    expect(container.childElementCount).toBe(0);
  });

  it("renders the breakpoint marker when enabled", () => {
    const { container } = render(<TailwindIndicator enabled />);
    const indicator = container.querySelector("[data-tailwind-indicator]");
    expect(indicator).not.toBeNull();
    expect(indicator?.getAttribute("aria-hidden")).toBe("true");
  });
});
