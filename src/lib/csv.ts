import type { Deal } from "./types";

const COLUMNS: (keyof Deal)[] = [
  "company", "contact", "email", "value", "stage", "owner", "source", "createdAt", "closeDate", "notes",
];

/** RFC 4180 field escaping, plus a guard against spreadsheet formula injection. */
export function escapeCsvField(value: unknown): string {
  let s = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function dealsToCsv(deals: Deal[]): string {
  const header = COLUMNS.join(",");
  const rows = deals.map((d) => COLUMNS.map((c) => escapeCsvField(d[c])).join(","));
  return [header, ...rows].join("\r\n");
}
