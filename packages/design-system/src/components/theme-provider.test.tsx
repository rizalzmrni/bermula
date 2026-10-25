import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ThemeProvider } from "./theme-provider";

const root = document.documentElement;

// next-themes memasang class lewat effect, jadi tunggu sampai diterapkan.
const waitForThemeClass = (theme: "dark" | "light") =>
  waitFor(() => {
    if (!root.classList.contains(theme)) {
      throw new Error(`<html> does not have the "${theme}" class yet`);
    }
  });

describe(ThemeProvider, () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    root.className = "";
  });

  it("applies the default theme as a class on <html>", async () => {
    render(<ThemeProvider defaultTheme="dark">content</ThemeProvider>);
    await waitForThemeClass("dark");
    expect(root.classList.contains("light")).toBeFalsy();
  });

  it("toggles between light and dark with the d shortcut", async () => {
    render(<ThemeProvider defaultTheme="light">content</ThemeProvider>);
    await waitForThemeClass("light");

    fireEvent.keyDown(document, { key: "d" });
    await waitForThemeClass("dark");
    expect(root.classList.contains("light")).toBeFalsy();

    fireEvent.keyDown(document, { key: "D" });
    await waitForThemeClass("light");
    expect(root.classList.contains("dark")).toBeFalsy();
  });

  it("ignores the shortcut while typing or with a modifier key", async () => {
    const { getByRole } = render(
      <ThemeProvider defaultTheme="light">
        <input aria-label="search" />
      </ThemeProvider>
    );
    await waitForThemeClass("light");

    fireEvent.keyDown(getByRole("textbox"), { key: "d" });
    fireEvent.keyDown(document, { ctrlKey: true, key: "d" });

    expect(root.classList.contains("dark")).toBeFalsy();
  });
});
