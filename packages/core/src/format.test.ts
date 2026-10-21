import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelativeTime,
} from "./format";

// Intl memakai spasi tak-putus (U+00A0) di antara simbol dan angka.
const NBSP = String.fromCodePoint(0xa0);
const normalizeSpaces = (value: string) => value.replaceAll(NBSP, " ");

describe(formatNumber, () => {
  it("uses id-ID separators by default", () => {
    expect(formatNumber(1_234_567.89)).toBe("1.234.567,89");
  });

  it("accepts a locale override and Intl options", () => {
    expect(formatNumber(0.256, { locale: "en-US", style: "percent" })).toBe(
      "26%"
    );
  });
});

describe(formatCurrency, () => {
  it("formats rupiah without decimals by default", () => {
    expect(normalizeSpaces(formatCurrency(1_500_000))).toBe("Rp 1.500.000");
  });

  it("keeps decimals for other currencies", () => {
    expect(formatCurrency(12.5, { currency: "USD", locale: "en-US" })).toBe(
      "$12.50"
    );
  });
});

describe(formatDate, () => {
  // 2026-01-31 20:00 UTC = 2026-02-01 03:00 WIB.
  const date = new Date("2026-01-31T20:00:00Z");

  it("uses Asia/Jakarta so server (UTC) and browser render the same day", () => {
    expect(formatDate(date)).toBe("1 Feb 2026");
  });

  it("respects explicit fields and time zone", () => {
    expect(
      formatDate(date, { day: "numeric", month: "long", timeZone: "UTC" })
    ).toBe("31 Januari");
  });
});

describe(formatRelativeTime, () => {
  const now = new Date("2026-10-21T12:00:00Z");

  it("formats past times in the largest fitting unit", () => {
    const date = new Date("2026-10-21T11:55:00Z");
    expect(formatRelativeTime({ date, now })).toBe("5 menit yang lalu");
  });

  it("formats future times", () => {
    const date = new Date("2026-10-23T12:00:00Z");
    expect(formatRelativeTime({ date, now })).toBe("lusa");
  });

  it("falls back to seconds for small differences", () => {
    expect(formatRelativeTime({ date: now, now })).toBe("sekarang");
  });
});
