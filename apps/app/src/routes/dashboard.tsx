import { APP_NAME } from "@bermula/core/brand";
import { EmptyState } from "@bermula/design-system/components/feedback/empty-state";
import { IconLayoutDashboard } from "@tabler/icons-react";

import { useAccount } from "../features/account/queries";

export const meta = () => [{ title: `Beranda — ${APP_NAME}` }];

const DashboardPage = () => {
  const { name } = useAccount().user;

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Halo, {name}</h1>
        <p className="text-muted-foreground text-sm">
          Ringkasan aktivitas organisasi Anda.
        </p>
      </div>
      <EmptyState
        description="Fitur pertama yang Anda bangun akan tampil di sini."
        icon={IconLayoutDashboard}
        title="Belum ada data"
      />
    </>
  );
};

export default DashboardPage;
