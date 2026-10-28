import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bermula/design-system/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bermula/design-system/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@bermula/design-system/components/ui/sidebar";
import { Skeleton } from "@bermula/design-system/components/ui/skeleton";
import {
  IconAlertTriangle,
  IconCheck,
  IconPlus,
  IconSelector,
  IconUser,
} from "@tabler/icons-react";
import { Link } from "react-router";

import { getInitials } from "../../lib/initials";
import { formatRole } from "./labels";
import { useOrganizations } from "./queries";
import type { Organization } from "./queries";

interface ContextAvatarProps {
  name: string;
  image?: string | null;
}

const ContextAvatar = ({ name, image }: ContextAvatarProps) => (
  <Avatar className="size-8 rounded-lg">
    {image ? <AvatarImage alt="" src={image} /> : null}
    <AvatarFallback className="rounded-lg">{getInitials(name)}</AvatarFallback>
  </Avatar>
);

const OrganizationItems = ({
  currentSlug,
}: {
  currentSlug: string | undefined;
}) => {
  const organizations = useOrganizations();

  if (organizations.isPending) {
    return (
      <div className="flex flex-col gap-2 p-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>
    );
  }
  if (organizations.isError) {
    return (
      <DropdownMenuItem onClick={() => organizations.refetch()}>
        <IconAlertTriangle className="text-destructive" />
        Gagal memuat. Coba lagi
      </DropdownMenuItem>
    );
  }
  if (organizations.data.length === 0) {
    return (
      <p className="text-muted-foreground px-2 py-1.5 text-sm">
        Belum ada organisasi.
      </p>
    );
  }
  return organizations.data.map((organization) => (
    <DropdownMenuItem
      key={organization.id}
      render={<Link to={`/o/${organization.slug}`} />}
    >
      <ContextAvatar image={organization.logo} name={organization.name} />
      <span className="grid flex-1 leading-tight">
        <span className="truncate">{organization.name}</span>
        <span className="text-muted-foreground truncate text-xs">
          {formatRole(organization.role)}
        </span>
      </span>
      {organization.slug === currentSlug ? (
        <IconCheck aria-label="Sedang dibuka" />
      ) : null}
    </DropdownMenuItem>
  ));
};

interface OrganizationSwitcherProps {
  /** `:slug` di URL saat berada di dashboard organisasi; `undefined` di dashboard pribadi. */
  currentSlug: string | undefined;
  user: { name: string; image: string | null };
}

const findCurrent = (
  organizations: Organization[] | undefined,
  slug: string | undefined
) => organizations?.find((organization) => organization.slug === slug);

/**
 * Pemilih konteks di header sidebar: dashboard pribadi atau salah satu
 * organisasi. Berpindah konteks = berpindah URL (`/` ↔ `/o/:slug`).
 */
export const OrganizationSwitcher = ({
  currentSlug,
  user,
}: OrganizationSwitcherProps) => {
  const organizations = useOrganizations();
  const current = findCurrent(organizations.data, currentSlug);
  const label = current ? current.name : "Pribadi";
  const caption = current ? "Organisasi" : user.name;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton aria-label="Ganti dashboard" size="lg" />
            }
          >
            <ContextAvatar
              image={current ? current.logo : user.image}
              name={current ? current.name : user.name}
            />
            <span className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{label}</span>
              <span className="text-muted-foreground truncate text-xs">
                {caption}
              </span>
            </span>
            <IconSelector aria-hidden="true" className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-64">
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link to="/" />}>
                <IconUser />
                <span className="flex-1">Dashboard pribadi</span>
                {currentSlug === undefined ? (
                  <IconCheck aria-label="Sedang dibuka" />
                ) : null}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Organisasi</DropdownMenuLabel>
              <OrganizationItems currentSlug={currentSlug} />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link to="/organizations/new" />}>
              <IconPlus />
              Buat organisasi
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
