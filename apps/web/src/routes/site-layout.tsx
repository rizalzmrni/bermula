import { SiteFooter } from "@bermula/design-system/components/layout/site-footer";
import { SiteHeader } from "@bermula/design-system/components/layout/site-header";
import { buttonVariants } from "@bermula/design-system/components/ui/button";
import { cn } from "cn";
import { Outlet } from "react-router";

import { getFooterGroups, HEADER_ITEMS } from "../lib/navigation";
import { APP_PATHS } from "../lib/paths";
import { appLink } from "../lib/site";
import type { Route } from "./+types/site-layout";

// Tahun dari loader agar SSR dan hidrasi memakai nilai yang sama.
export const loader = () => ({ year: new Date().getFullYear() });

// Tautan ke apps/app (origin lain) memakai `<a>` biasa bergaya tombol: navigasi
// dokumen penuh, bukan navigasi klien React Router.
const HeaderActions = () => (
  <>
    <a
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "hidden sm:inline-flex"
      )}
      href={appLink(APP_PATHS.signIn)}
    >
      Masuk
    </a>
    <a className={buttonVariants()} href={appLink(APP_PATHS.signUp)}>
      Daftar
    </a>
  </>
);

const SiteLayout = ({ loaderData }: Route.ComponentProps) => (
  <div className="flex min-h-svh flex-col">
    <SiteHeader actions={<HeaderActions />} items={HEADER_ITEMS} />
    <div className="flex flex-1 flex-col">
      <Outlet />
    </div>
    <SiteFooter
      description="Fondasi SaaS siap produksi: autentikasi, organisasi, penyimpanan, dan email dalam satu paket."
      groups={getFooterGroups()}
      year={loaderData.year}
    />
  </div>
);

export default SiteLayout;
