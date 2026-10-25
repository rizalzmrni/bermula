import { TailwindIndicator } from "@bermula/design-system/components/tailwind-indicator";
import { ThemeProvider } from "@bermula/design-system/components/theme-provider";
import type { ThemeProviderProps } from "@bermula/design-system/components/theme-provider";
import { Toaster } from "@bermula/design-system/components/ui/toast";
import { TooltipProvider } from "@bermula/design-system/components/ui/tooltip";
import { NuqsAdapter } from "nuqs/adapters/react-router/v8";

type DesignSystemProviderProps = ThemeProviderProps & {
  /** Tampilkan penanda breakpoint; app mengaktifkannya hanya di development. */
  showTailwindIndicator?: boolean;
};

/**
 * Provider UI global (tema, query string, tooltip, toast) untuk dipasang sekali
 * di root layout tiap app. Harus berada di dalam router React Router karena
 * adapter nuqs membaca lokasi dari router.
 *
 * @example
 * // apps/app/app/root.tsx
 * export const Layout = ({ children }: { children: ReactNode }) => (
 *   <html lang="id" suppressHydrationWarning>
 *     <head>…</head>
 *     <body>
 *       <DesignSystemProvider>
 *         {children}
 *       </DesignSystemProvider>
 *       <Scripts />
 *     </body>
 *   </html>
 * );
 */
export const DesignSystemProvider = ({
  children,
  showTailwindIndicator = false,
  ...themeProps
}: DesignSystemProviderProps) => (
  <ThemeProvider {...themeProps}>
    <NuqsAdapter>
      <TooltipProvider delay={0}>
        {children}
        <Toaster />
      </TooltipProvider>
    </NuqsAdapter>
    <TailwindIndicator enabled={showTailwindIndicator} />
  </ThemeProvider>
);
