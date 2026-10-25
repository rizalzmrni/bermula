import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bermula/design-system/components/ui/empty";
import type { NavIcon } from "@bermula/design-system/lib/navigation";
import { IconInbox } from "@tabler/icons-react";
import { cn } from "cn";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: ReactNode;
  /** Jelaskan apa yang biasanya ada di sini dan cara mengisinya. */
  description?: ReactNode;
  icon?: NavIcon;
  /** Aksi berikutnya, mis. tombol "Buat proyek". */
  action?: ReactNode;
  className?: string;
}

/** State kosong untuk daftar/tabel/halaman yang belum punya data. */
export const EmptyState = ({
  title,
  description,
  icon: Icon = IconInbox,
  action,
  className,
}: EmptyStateProps) => (
  <Empty className={cn("border", className)}>
    <EmptyHeader>
      <EmptyMedia aria-hidden="true" variant="icon">
        <Icon />
      </EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      {description ? <EmptyDescription>{description}</EmptyDescription> : null}
    </EmptyHeader>
    {action ? <EmptyContent>{action}</EmptyContent> : null}
  </Empty>
);
