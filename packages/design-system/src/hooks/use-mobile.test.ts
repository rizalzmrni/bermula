import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useIsMobile } from "./use-mobile";

type Listener = (type: string, listener: () => void) => void;

const mockMatchMedia = (matches: boolean) =>
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        addEventListener: vi.fn<Listener>(),
        matches,
        media: query,
        removeEventListener: vi.fn<Listener>(),
      }) as unknown as MediaQueryList
  );

describe(useIsMobile, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true below the mobile breakpoint", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBeTruthy();
  });

  it("returns false on wider screens", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBeFalsy();
  });
});
