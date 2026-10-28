import { APP_NAME } from "@bermula/core/brand";
import { EmptyState } from "@bermula/design-system/components/feedback/empty-state";
import { Badge } from "@bermula/design-system/components/ui/badge";
import { IconLayoutDashboard } from "@tabler/icons-react";
import { useParams } from "react-router";

import { formatRole } from "../features/organizations/labels";
import { useCurrentOrganization } from "../features/organizations/queries";

export const meta = () => [{ title: `Organisasi — ${APP_NAME}` }];

/** Beranda dashboard organisasi; data ter-scope organisasi di URL. */
const OrganizationDashboardPage = () => {
  const organization = useCurrentOrganization(useParams().slug ?? "");

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {organization.name}
          </h1>
          <Badge variant="secondary">{formatRole(organization.role)}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Ringkasan aktivitas organisasi.
        </p>
      </div>
      <EmptyState
        description="Fitur pertama organisasi yang Anda bangun akan tampil di sini."
        icon={IconLayoutDashboard}
        title="Belum ada data"
      />
    </div>
  );
};

export default OrganizationDashboardPage;
