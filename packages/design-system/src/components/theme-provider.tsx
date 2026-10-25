import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect } from "react";
import type { ComponentProps } from "react";

const TOGGLE_THEME_KEY = "d";

const isTypingTarget = (target: EventTarget | null) =>
  (target instanceof HTMLElement && target.isContentEditable) ||
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement;

// Autofill Chrome mengirim `keydown` berupa `Event` biasa tanpa `key`, jadi
// tipe event dipersempit dulu, bukan diasumsikan `KeyboardEvent`.
const isToggleShortcut = (event: Event): event is KeyboardEvent =>
  event instanceof KeyboardEvent &&
  event.key.toLowerCase() === TOGGLE_THEME_KEY &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.altKey &&
  !isTypingTarget(event.target);

// Pintasan "d" untuk beralih terang/gelap, kecuali saat sedang mengetik.
const ThemeShortcut = () => {
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const onKeyDown = (event: Event) => {
      if (!isToggleShortcut(event)) {
        return;
      }
      event.preventDefault();
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [resolvedTheme, setTheme]);

  return null;
};

export type ThemeProviderProps = ComponentProps<typeof NextThemesProvider>;

/**
 * Tema lewat next-themes (class `.dark` di `<html>`, disimpan di localStorage).
 * Skrip anti-kedip disisipkan next-themes saat SSR, jadi `<html>` di root
 * layout app wajib memakai `suppressHydrationWarning`.
 */
export const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => (
  <NextThemesProvider
    attribute="class"
    defaultTheme="system"
    disableTransitionOnChange
    enableColorScheme
    enableSystem
    {...props}
  >
    <ThemeShortcut />
    {children}
  </NextThemesProvider>
);
