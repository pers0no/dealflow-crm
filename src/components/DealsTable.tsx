"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Pencil, Trash2 } from "lucide-react";
import { formatDate, formatUSD } from "@/lib/format";
import { OPEN_STAGES, type Deal, type ISODate, type SortKey, type SortState } from "@/lib/types";
import { Avatar, Button, StageBadge } from "./ui";

export const PAGE_SIZE = 10;

interface Props {
  rows: Deal[]; // the current page
  total: number; // all matching rows
  page: number;
  pageCount: number;
  sort: SortState;
  today: ISODate;
  highlightId: string | null;
  onSort: (key: SortKey) => void;
  onPage: (page: number) => void;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  empty: React.ReactNode;
}

const COLUMNS: { key: SortKey; label: string; className?: string; align?: "right" }[] = [
  { key: "company", label: "Company" },
  { key: "value", label: "Value", align: "right" },
  { key: "stage", label: "Stage", className: "hidden sm:table-cell" },
  { key: "owner", label: "Owner", className: "hidden lg:table-cell" },
  { key: "closeDate", label: "Close date", className: "hidden sm:table-cell" },
];

const scrollIntoView = (el: HTMLTableRowElement | null) => {
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
};

export function DealsTable({ rows, total, page, pageCount, sort, today, highlightId, onSort, onPage, onEdit, onDelete, empty }: Props) {
  if (total === 0) return <div className="px-4 py-16">{empty}</div>;

  const from = page * PAGE_SIZE + 1;
  const to = from + rows.length - 1;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Deals, sorted by {sort.key} {sort.dir === "asc" ? "ascending" : "descending"}</caption>
          <thead>
            <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-muted">
              {COLUMNS.map((col) => {
                const active = sort.key === col.key;
                const Icon = !active ? ChevronsUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                    className={`px-4 py-2.5 font-medium ${col.align === "right" ? "text-right" : ""} ${col.className ?? ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => onSort(col.key)}
                      className={`-mx-1 inline-flex items-center gap-1 rounded px-1 uppercase hover:text-ink focus-visible:outline-2 focus-visible:outline-ring ${active ? "text-ink" : ""}`}
                    >
                      {col.label}
                      <Icon aria-hidden className={`size-3.5 ${active ? "" : "opacity-50"}`} />
                    </button>
                  </th>
                );
              })}
              <th scope="col" className="hidden px-4 py-2.5 sm:table-cell">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((deal) => {
              const overdue = OPEN_STAGES.includes(deal.stage) && deal.closeDate < today;
              const highlighted = deal.id === highlightId;
              return (
                <tr
                  key={deal.id}
                  ref={highlighted ? scrollIntoView : undefined}
                  onClick={() => onEdit(deal)}
                  className={`group cursor-pointer border-b border-line transition-colors duration-700 last:border-0 hover:bg-hover ${
                    highlighted ? "bg-accent-soft" : ""
                  }`}
                >
                  <td className="max-w-[16rem] px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(deal);
                      }}
                      className="block max-w-full truncate text-left font-medium text-ink hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {deal.company}
                    </button>
                    <div className="truncate text-xs text-muted">
                      {deal.contact} · {deal.source}
                    </div>
                    {/* On phones the Stage column is hidden, so the badge moves under the name. */}
                    <div className="mt-1 sm:hidden">
                      <StageBadge stage={deal.stage} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">{formatUSD(deal.value)}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <StageBadge stage={deal.stage} />
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-ink-2 lg:table-cell">
                    <span className="inline-flex items-center gap-2">
                      <Avatar name={deal.owner} />
                      {deal.owner}
                    </span>
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 tabular-nums text-ink-2 sm:table-cell">
                    {formatDate(deal.closeDate)}
                    {overdue && (
                      <span className="ml-2 rounded bg-critical-soft px-1.5 py-0.5 text-[11px] font-medium text-critical">
                        Overdue
                      </span>
                    )}
                  </td>
                  <td className="hidden whitespace-nowrap px-2 py-3 text-right sm:table-cell">
                    <div className="flex justify-end gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Edit ${deal.company}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(deal);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        aria-label={`Delete ${deal.company}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(deal);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <nav className="flex items-center justify-between gap-4 border-t border-line px-4 py-3 text-sm" aria-label="Pagination">
        <p className="text-muted">
          Showing <span className="font-medium text-ink tabular-nums">{from}–{to}</span> of{" "}
          <span className="font-medium text-ink tabular-nums">{total}</span> deals
        </p>
        <div className="flex items-center gap-2">
          <span className="hidden text-muted sm:inline tabular-nums">
            Page {page + 1} of {pageCount}
          </span>
          <Button size="sm" onClick={() => onPage(page - 1)} disabled={page === 0} aria-label="Previous page">
            <ChevronLeft className="size-4" />
          </Button>
          <Button size="sm" onClick={() => onPage(page + 1)} disabled={page >= pageCount - 1} aria-label="Next page">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </nav>
    </>
  );
}
