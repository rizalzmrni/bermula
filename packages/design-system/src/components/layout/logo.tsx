import { APP_NAME } from "@bermula/core/brand";
import { cn } from "cn";
import { Link } from "react-router";

interface LogoProps {
  href?: string;
  /** Sembunyikan nama (mis. sidebar terlipat); tautan tetap punya label. */
  showName?: boolean;
  className?: string;
}

/** Tanda + nama brand yang menaut ke beranda. Ganti tanda dengan SVG brand. */
export const Logo = ({ href = "/", showName = true, className }: LogoProps) => (
  <Link
    aria-label={showName ? undefined : APP_NAME}
    className={cn(
      "text-foreground focus-visible:ring-ring/50 flex items-center gap-2 rounded-md font-semibold outline-none focus-visible:ring-3",
      className
    )}
    to={href}
  >
    <span
      aria-hidden="true"
      className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-sm font-bold"
    >
      {APP_NAME.charAt(0)}
    </span>
    {showName ? <span>{APP_NAME}</span> : null}
  </Link>
);
