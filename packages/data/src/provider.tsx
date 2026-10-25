import { QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import type { ReactNode } from "react";

import { createQueryClient } from "./query-client";

// Devtools hanya dimuat (dan masuk bundle sebagai chunk terpisah) saat dev.
const ReactQueryDevtools = lazy(async () => {
  const module = await import("@tanstack/react-query-devtools");
  return { default: module.ReactQueryDevtools };
});

interface DataProviderProps {
  children: ReactNode;
  /** Tampilkan devtools TanStack Query; biasanya `import.meta.env.DEV`. */
  devtools?: boolean;
}

/**
 * Provider TanStack Query untuk app. Client dibuat sekali per render tree
 * (`useState`), jadi satu per request saat SSR dan satu per tab di browser.
 */
export const DataProvider = ({
  children,
  devtools = false,
}: DataProviderProps) => {
  // Pola resmi TanStack: client dibuat sekali dan tidak pernah diganti, jadi
  // setter memang tidak dibutuhkan.
  // oxlint-disable-next-line react/hook-use-state
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {devtools ? (
        <Suspense>
          <ReactQueryDevtools buttonPosition="bottom-left" />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  );
};
