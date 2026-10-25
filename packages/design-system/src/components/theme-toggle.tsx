import { Button } from "@bermula/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@bermula/design-system/components/ui/dropdown-menu";
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";

const THEME_OPTIONS = [
  { icon: IconSun, label: "Terang", value: "light" },
  { icon: IconMoon, label: "Gelap", value: "dark" },
  { icon: IconDeviceDesktop, label: "Sistem", value: "system" },
] as const;

/** Pilihan tema terang/gelap/sistem; harus berada di dalam `ThemeProvider`. */
export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size="icon" variant="ghost" />}>
        {/* Ikon dipilih lewat CSS agar SSR (tema belum diketahui) tidak berkedip. */}
        <IconSun className="dark:hidden" />
        <IconMoon className="hidden dark:block" />
        <span className="sr-only">Ganti tema</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup onValueChange={setTheme} value={theme}>
          {THEME_OPTIONS.map(({ icon: Icon, label, value }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
