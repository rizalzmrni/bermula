import { AppSidebar } from "@bermula/design-system/components/layout/app-sidebar";
import { ThemeToggle } from "@bermula/design-system/components/theme-toggle";
import { Separator } from "@bermula/design-system/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@bermula/design-system/components/ui/sidebar";
import type { NavGroup } from "@bermula/design-system/lib/navigation";
import type { ReactNode } from "react";

interface AppShellProps {
  groups: NavGroup[];
  /**
   * Status sidebar dari cookie (`readSidebarOpen(request.headers.get("Cookie"))`
   * di loader), agar SSR merender lebar yang benar.
   */
  defaultOpen?: boolean;
  sidebarHeader?: ReactNode;
  sidebarFooter?: ReactNode;
  /** Slot kiri header, mis. breadcrumb atau judul halaman. */
  title?: ReactNode;
  /** Slot kanan header, mis. notifikasi. */
  actions?: ReactNode;
  showThemeToggle?: boolean;
  children: ReactNode;
}

/** Kerangka halaman terproteksi: sidebar + header ringkas + konten. */
export const AppShell = ({
  groups,
  defaultOpen = true,
  sidebarHeader,
  sidebarFooter,
  title,
  actions,
  showThemeToggle = true,
  children,
}: AppShellProps) => (
  <SidebarProvider defaultOpen={defaultOpen}>
    <AppSidebar footer={sidebarFooter} groups={groups} header={sidebarHeader} />
    <SidebarInset>
      <header className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
        <SidebarTrigger className="-ml-1" />
        {title ? (
          <>
            <Separator className="mr-2 h-4" orientation="vertical" />
            <div className="min-w-0 flex-1 truncate">{title}</div>
          </>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex items-center gap-2">
          {actions}
          {showThemeToggle ? <ThemeToggle /> : null}
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
    </SidebarInset>
  </SidebarProvider>
);
