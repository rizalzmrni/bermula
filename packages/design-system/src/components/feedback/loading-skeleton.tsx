import { Skeleton } from "@bermula/design-system/components/ui/skeleton";
import { cn } from "cn";

/** Bentuk placeholder; pilih yang paling mirip dengan konten aslinya. */
export const SKELETON_VARIANT = {
  cards: "cards",
  list: "list",
  table: "table",
  text: "text",
} as const;

export type SkeletonVariant =
  (typeof SKELETON_VARIANT)[keyof typeof SKELETON_VARIANT];

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  /** Jumlah baris/kartu. */
  rows?: number;
  /** Jumlah kolom untuk `table`. */
  columns?: number;
  /** Diumumkan pembaca layar. */
  label?: string;
  className?: string;
}

const DEFAULT_ROWS = 3;
const DEFAULT_COLUMNS = 4;

const range = (count: number) =>
  Array.from({ length: count }, (_, index) => index);

const ListRows = ({ rows }: { rows: number }) =>
  range(rows).map((row) => (
    <div className="flex items-center gap-3" key={row}>
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  ));

const TableRows = ({ rows, columns }: { rows: number; columns: number }) =>
  // Baris pertama (lebih tipis) mewakili header tabel.
  range(rows + 1).map((row) => (
    <div
      className="grid gap-4"
      key={row}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {range(columns).map((column) => (
        <Skeleton className={row === 0 ? "h-3" : "h-5"} key={column} />
      ))}
    </div>
  ));

const CardGrid = ({ rows }: { rows: number }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {range(rows).map((card) => (
      <div className="flex flex-col gap-3 rounded-xl border p-4" key={card}>
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    ))}
  </div>
);

const TextLines = ({ rows }: { rows: number }) =>
  range(rows).map((line) => (
    // Baris terakhir lebih pendek agar menyerupai paragraf.
    <Skeleton
      className={cn("h-4", line === rows - 1 ? "w-3/5" : "w-full")}
      key={line}
    />
  ));

const SkeletonShape = ({
  variant,
  rows,
  columns,
}: {
  variant: SkeletonVariant;
  rows: number;
  columns: number;
}) => {
  switch (variant) {
    case SKELETON_VARIANT.cards: {
      return <CardGrid rows={rows} />;
    }
    case SKELETON_VARIANT.table: {
      return <TableRows columns={columns} rows={rows} />;
    }
    case SKELETON_VARIANT.text: {
      return <TextLines rows={rows} />;
    }
    default: {
      return <ListRows rows={rows} />;
    }
  }
};

/** Placeholder `bg-muted` selama data dimuat (bukan spinner kosong). */
export const LoadingSkeleton = ({
  variant = SKELETON_VARIANT.list,
  rows = DEFAULT_ROWS,
  columns = DEFAULT_COLUMNS,
  label = "Memuat…",
  className,
}: LoadingSkeletonProps) => (
  // `<output>` punya peran implisit `status`, jadi label diumumkan pembaca layar.
  <output
    aria-busy="true"
    className={cn("flex w-full flex-col gap-4", className)}
  >
    <span className="sr-only">{label}</span>
    <div aria-hidden="true" className="contents">
      <SkeletonShape columns={columns} rows={rows} variant={variant} />
    </div>
  </output>
);
