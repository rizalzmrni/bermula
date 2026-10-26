import { useAnalytics } from "@bermula/analytics/analytics-provider";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bermula/design-system/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@bermula/design-system/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@bermula/design-system/components/ui/sidebar";
import { IconLogout, IconSelector } from "@tabler/icons-react";
import { useSubmit } from "react-router";

interface UserMenuProps {
  user: { name: string; email: string; image: string | null };
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

/** Menu pengguna di footer sidebar: identitas + keluar. */
export const UserMenu = ({ user }: UserMenuProps) => {
  const submit = useSubmit();
  const analytics = useAnalytics();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
            <Avatar className="size-8 rounded-lg">
              {user.image ? <AvatarImage alt="" src={user.image} /> : null}
              <AvatarFallback className="rounded-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
            <IconSelector aria-hidden="true" className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56" side="top">
            <DropdownMenuItem
              onClick={() => {
                // Event setelah logout tidak boleh tercatat atas nama pengguna ini.
                analytics.reset();
                submit(null, { action: "/sign-out", method: "post" });
              }}
            >
              <IconLogout />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
