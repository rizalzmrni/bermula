import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ThemeProvider } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";

const root = document.documentElement;

describe(ThemeToggle, () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    root.className = "";
  });

  it("switches to the selected theme", async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Ganti tema" }));
    fireEvent.click(
      await screen.findByRole("menuitemradio", { name: "Gelap" })
    );

    await waitFor(() => {
      if (!root.classList.contains("dark")) {
        throw new Error("dark theme was not applied");
      }
    });
    expect(localStorage.getItem("theme")).toBe("dark");
  });
});
