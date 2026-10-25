import { cn } from "cn";
import type { ComponentProps } from "react";

/** Lebar konten dan gutter horizontal yang seragam untuk header, footer, dan halaman. */
export const Container = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn("mx-auto w-full max-w-7xl px-4 md:px-6", className)}
    {...props}
  />
);
