const DEFAULT_LOCALE = "id-ID";
const DEFAULT_CURRENCY = "IDR";
// Zona waktu tetap agar hasil SSR (Worker berjalan di UTC) sama dengan hasil
// di browser pengguna; tanpa ini tanggal bisa bergeser dan memicu hydration mismatch.
const DEFAULT_TIME_ZONE = "Asia/Jakarta";

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86_400;
const SECONDS_PER_WEEK = 604_800;
const SECONDS_PER_MONTH = 2_629_800;
const SECONDS_PER_YEAR = 31_557_600;
const MS_PER_SECOND = 1000;

interface LocaleOption {
  locale?: string;
}

export type NumberFormatOptions = Intl.NumberFormatOptions & LocaleOption;

export type CurrencyFormatOptions = Omit<
  Intl.NumberFormatOptions,
  "style" | "currency"
> &
  LocaleOption & {
    currency?: string;
  };

export type DateFormatOptions = Intl.DateTimeFormatOptions & LocaleOption;

export type RelativeTimeInput = LocaleOption & {
  date: Date | number;
  /** Waktu acuan; disuntikkan agar fungsi tetap murni dan mudah diuji. */
  now: Date | number;
};

export const formatNumber = (
  value: number,
  { locale = DEFAULT_LOCALE, ...options }: NumberFormatOptions = {}
): string => new Intl.NumberFormat(locale, options).format(value);

export const formatCurrency = (
  value: number,
  {
    locale = DEFAULT_LOCALE,
    currency = DEFAULT_CURRENCY,
    ...options
  }: CurrencyFormatOptions = {}
): string => {
  // Rupiah praktis tidak memakai sen, jadi desimal disembunyikan secara default.
  const fractionDigits =
    currency === DEFAULT_CURRENCY
      ? { maximumFractionDigits: 0, minimumFractionDigits: 0 }
      : {};

  return new Intl.NumberFormat(locale, {
    ...fractionDigits,
    ...options,
    currency,
    style: "currency",
  }).format(value);
};

export const formatDate = (
  date: Date | number,
  {
    locale = DEFAULT_LOCALE,
    timeZone = DEFAULT_TIME_ZONE,
    ...options
  }: DateFormatOptions = {}
): string => {
  const hasExplicitFields = Object.keys(options).length > 0;

  return new Intl.DateTimeFormat(locale, {
    ...(hasExplicitFields ? options : { dateStyle: "medium" }),
    timeZone,
  }).format(date);
};

const RELATIVE_UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", SECONDS_PER_YEAR],
  ["month", SECONDS_PER_MONTH],
  ["week", SECONDS_PER_WEEK],
  ["day", SECONDS_PER_DAY],
  ["hour", SECONDS_PER_HOUR],
  ["minute", SECONDS_PER_MINUTE],
];

export const formatRelativeTime = ({
  date,
  now,
  locale = DEFAULT_LOCALE,
}: RelativeTimeInput): string => {
  const diffSeconds =
    (new Date(date).getTime() - new Date(now).getTime()) / MS_PER_SECOND;
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const [unit, secondsInUnit] of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= secondsInUnit) {
      return formatter.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }

  return formatter.format(Math.round(diffSeconds), "second");
};
