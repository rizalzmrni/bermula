import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

const getSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;

// Server tidak tahu lebar layar; anggap desktop sampai hidrasi selesai.
const getServerSnapshot = () => false;

// useSyncExternalStore (bukan useEffect + setState) agar tidak ada render
// berantai dan nilai langsung benar saat hidrasi.
export const useIsMobile = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
