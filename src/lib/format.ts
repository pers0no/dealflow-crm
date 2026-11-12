import { parseISODate } from "./dates";
import type { ISODate } from "./types";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });
const monthYearFmt = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

export const formatUSD = (n: number) => usd.format(n);
export const formatUSDCompact = (n: number) => usdCompact.format(n);
export const formatDate = (s: ISODate) => dateFmt.format(parseISODate(s));
export const formatPercent = (n: number) => `${Math.round(n * 100)}%`;

/** "2026-11" -> "Nov" */
export const formatMonthShort = (key: string) => monthFmt.format(parseISODate(`${key}-01`));
/** "2026-11" -> "November 2026" */
export const formatMonthLong = (key: string) => monthYearFmt.format(parseISODate(`${key}-01`));
