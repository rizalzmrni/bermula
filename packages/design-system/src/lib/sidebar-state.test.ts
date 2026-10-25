import { describe, expect, it } from "vitest";

import { readSidebarOpen } from "./sidebar-state";

describe(readSidebarOpen, () => {
  it("defaults to open without a cookie", () => {
    expect(readSidebarOpen(null)).toBeTruthy();
    expect(readSidebarOpen("theme=dark")).toBeTruthy();
  });

  it("reads the stored state among other cookies", () => {
    expect(readSidebarOpen("a=1; sidebar_state=false; b=2")).toBeFalsy();
    expect(readSidebarOpen("sidebar_state=true")).toBeTruthy();
  });
});
