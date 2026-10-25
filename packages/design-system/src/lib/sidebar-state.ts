// Harus sama dengan `SIDEBAR_COOKIE_NAME` di `components/ui/sidebar.tsx`
// (file generate shadcn yang menulis cookie ini saat sidebar dibuka/ditutup).
export const SIDEBAR_COOKIE_NAME = "sidebar_state";

const COOKIE_SEPARATOR = ";";

/**
 * Status sidebar terakhir dari header `Cookie`, untuk `defaultOpen` di loader
 * agar SSR langsung merender lebar yang benar (tanpa kedip). Default terbuka.
 */
export const readSidebarOpen = (cookieHeader: string | null): boolean => {
  for (const part of (cookieHeader ?? "").split(COOKIE_SEPARATOR)) {
    const [name, value] = part.trim().split("=");
    if (name === SIDEBAR_COOKIE_NAME) {
      return value !== "false";
    }
  }
  return true;
};
