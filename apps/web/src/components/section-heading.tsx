import { cn } from "cn";
import type { ReactNode } from "react";

interface SectionHeadingProps {
  /** `id` heading, dipakai `aria-labelledby` pada section. */
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Label kecil di atas judul. */
  eyebrow?: ReactNode;
  className?: string;
}

/** Judul section marketing yang seragam (rata tengah, lebar teks terbatas). */
export const SectionHeading = ({
  id,
  title,
  description,
  eyebrow,
  className,
}: SectionHeadingProps) => (
  <div
    className={cn(
      "mx-auto flex max-w-2xl flex-col items-center gap-3 text-center",
      className
    )}
  >
    {eyebrow ? (
      <p className="text-primary text-sm font-medium">{eyebrow}</p>
    ) : null}
    <h2
      className="text-3xl font-semibold tracking-tight text-balance md:text-4xl"
      id={id}
    >
      {title}
    </h2>
    {description ? (
      <p className="text-muted-foreground text-base text-pretty md:text-lg">
        {description}
      </p>
    ) : null}
  </div>
);
