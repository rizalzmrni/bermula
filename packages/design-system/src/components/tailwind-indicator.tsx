interface TailwindIndicatorProps {
  /**
   * Ditentukan app (mis. hanya saat development). Paket ini tidak membaca env
   * sendiri; env hanya dibaca lewat `packages/env`.
   */
  enabled?: boolean;
}

/** Penanda breakpoint aktif untuk debugging layout; jangan aktifkan di produksi. */
export const TailwindIndicator = ({
  enabled = false,
}: TailwindIndicatorProps) => {
  if (!enabled) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="bg-foreground text-background fixed bottom-1 left-1 z-50 flex size-6 items-center justify-center rounded-full p-3 font-mono text-xs"
      data-tailwind-indicator=""
    >
      <div className="block sm:hidden">xs</div>
      <div className="hidden sm:block md:hidden">sm</div>
      <div className="hidden md:block lg:hidden">md</div>
      <div className="hidden lg:block xl:hidden">lg</div>
      <div className="hidden xl:block 2xl:hidden">xl</div>
      <div className="hidden 2xl:block">2xl</div>
    </div>
  );
};
