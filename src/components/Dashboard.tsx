"use client";

import { Download, Plus, RotateCcw, SearchX } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { dealsToCsv } from "@/lib/csv";
import {
  computeKpis,
  countByStage,
  filterDeals,
  hasActiveFilters,
  pipelineByStage,
  sortDeals,
  wonByMonth,
} from "@/lib/selectors";
import { EMPTY_FILTERS, type Deal, type Filters, type SortKey, type SortState } from "@/lib/types";
import { DealsProvider, useDeals } from "@/state/DealsProvider";
import { PipelineChart, RevenueChart } from "./Charts";
import { DealDialog } from "./DealDialog";
import { DealsTable, PAGE_SIZE } from "./DealsTable";
import { KpiCards } from "./KpiCards";
import { Toast, type ToastState } from "./Toast";
import { Toolbar } from "./Toolbar";
import { Button, Card } from "./ui";

export default function Dashboard() {
  return (
    <DealsProvider>
      <DashboardView />
    </DealsProvider>
  );
}

type DialogState = { mode: "create" } | { mode: "edit"; deal: Deal } | null;

/** Numeric/date columns start descending (biggest, latest first); text columns start A→Z. */
const DEFAULT_DIR: Record<SortKey, SortState["dir"]> = {
  company: "asc",
  owner: "asc",
  stage: "asc",
  value: "desc",
  closeDate: "desc",
};

function DashboardView() {
  const { deals, today, addDeal, updateDeal, deleteDeal, resetDemo } = useDeals();

  // ---- UI state ----------------------------------------------------------------
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortState>({ key: "closeDate", dir: "desc" });
  const [page, setPage] = useState(0);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Typing stays instant; the expensive filtering/charting re-renders at lower priority.
  const deferredQuery = useDeferredValue(filters.query);
  const activeFilters = useMemo(() => ({ ...filters, query: deferredQuery }), [filters, deferredQuery]);

  // ---- Derived data (never stored, always computed from deals + filters) ----------
  const filtered = useMemo(() => filterDeals(deals, activeFilters), [deals, activeFilters]);
  const sorted = useMemo(() => sortDeals(filtered, sort), [filtered, sort]);
  const kpis = useMemo(() => computeKpis(filtered, today), [filtered, today]);
  const byStage = useMemo(() => pipelineByStage(filtered), [filtered]);
  const byMonth = useMemo(() => wonByMonth(filtered, today), [filtered, today]);
  // Chip counts ignore the stage filter itself, so you can see what each chip would add.
  const stageCounts = useMemo(
    () => countByStage(filterDeals(deals, { ...activeFilters, stages: [] })),
    [deals, activeFilters],
  );

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1); // e.g. after deleting the last row on the last page
  const pageRows = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const isFiltered = hasActiveFilters(filters);

  // ---- Handlers --------------------------------------------------------------------
  const notify = useCallback((message: string, onUndo?: () => void) => {
    setToast({ id: Date.now(), message, onUndo });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);

  // Briefly highlight a row that was just added or edited.
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightTimer = useRef<number | undefined>(undefined);
  const flashRow = (id: string) => {
    window.clearTimeout(highlightTimer.current);
    setHighlightId(id);
    highlightTimer.current = window.setTimeout(() => setHighlightId(null), 2500);
  };
  useEffect(() => () => window.clearTimeout(highlightTimer.current), []);

  const changeFilters = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
  };
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(0);
  };

  const changeSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: DEFAULT_DIR[key] }));
    setPage(0);
  };

  const handleDelete = (deal: Deal) => {
    const undo = deleteDeal(deal.id);
    setDialog(null);
    notify(`Deleted “${deal.company}”`, undo);
  };

  const handleReset = () => {
    const undo = resetDemo();
    clearFilters();
    notify("Demo data restored", undo);
  };

  const exportCsv = () => {
    const blob = new Blob([dealsToCsv(sorted)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deals-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcuts: "/" focuses search, "n" opens the new-deal form.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (dialog || e.metaKey || e.ctrlKey || e.altKey) return;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setDialog({ mode: "create" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Sales pipeline</h1>
            <p className="text-sm text-muted">Dealflow CRM · demo data saved in your browser</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={handleReset} title="Replace all deals with the demo dataset">
            <RotateCcw className="size-4" /> Reset demo
          </Button>
          <Button onClick={exportCsv} disabled={sorted.length === 0} title="Download the filtered deals as CSV">
            <Download className="size-4" /> Export CSV
          </Button>
          <Button variant="primary" onClick={() => setDialog({ mode: "create" })} aria-keyshortcuts="n">
            <Plus className="size-4" /> New deal
          </Button>
        </div>
      </header>

      <main className="flex flex-col gap-4">
        <KpiCards kpis={kpis} />

        <div className="grid gap-4 lg:grid-cols-5">
          <RevenueChart data={byMonth} className="lg:col-span-3" />
          <PipelineChart data={byStage} className="lg:col-span-2" />
        </div>

        <Card aria-label="Deals">
          <Toolbar
            ref={searchRef}
            filters={filters}
            stageCounts={stageCounts}
            isFiltered={isFiltered}
            onChange={changeFilters}
            onClear={clearFilters}
          />
          <DealsTable
            rows={pageRows}
            total={sorted.length}
            page={safePage}
            pageCount={pageCount}
            sort={sort}
            today={today}
            highlightId={highlightId}
            onSort={changeSort}
            onPage={setPage}
            onEdit={(deal) => setDialog({ mode: "edit", deal })}
            onDelete={handleDelete}
            empty={
              <EmptyState
                filtered={deals.length > 0}
                onClear={clearFilters}
                onCreate={() => setDialog({ mode: "create" })}
              />
            }
          />
        </Card>

        <p className="pb-16 text-center text-xs text-muted">
          Built with Next.js, React, TypeScript, Tailwind CSS and Recharts. Shortcuts:{" "}
          <kbd className="rounded border border-line px-1 font-mono">/</kbd> search ·{" "}
          <kbd className="rounded border border-line px-1 font-mono">N</kbd> new deal
        </p>
      </main>

      {dialog && (
        <DealDialog
          key={dialog.mode === "edit" ? dialog.deal.id : "new"}
          deal={dialog.mode === "edit" ? dialog.deal : null}
          today={today}
          onClose={() => setDialog(null)}
          onDelete={handleDelete}
          onSave={(input) => {
            if (dialog.mode === "edit") {
              updateDeal(dialog.deal.id, input);
              flashRow(dialog.deal.id);
              notify(`Saved “${input.company}”`);
            } else {
              const created = addDeal(input);
              // Make sure the new deal is visible: drop filters and jump to the page it sorts onto.
              clearFilters();
              const index = sortDeals([created, ...deals], sort).findIndex((d) => d.id === created.id);
              setPage(Math.floor(index / PAGE_SIZE));
              flashRow(created.id);
              notify(`Added “${input.company}” to the pipeline`);
            }
            setDialog(null);
          }}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

function EmptyState({ filtered, onClear, onCreate }: { filtered: boolean; onClear: () => void; onCreate: () => void }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center text-center">
      <SearchX aria-hidden className="mb-3 size-8 text-muted" />
      <p className="font-medium">{filtered ? "No deals match your filters" : "No deals yet"}</p>
      <p className="mt-1 text-sm text-muted">
        {filtered ? "Try a different search term or remove a filter." : "Add your first opportunity to start tracking the pipeline."}
      </p>
      <div className="mt-4">
        {filtered ? (
          <Button onClick={onClear}>Clear filters</Button>
        ) : (
          <Button variant="primary" onClick={onCreate}>
            <Plus className="size-4" /> New deal
          </Button>
        )}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-9 shrink-0" aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <path d="M8 21h4v-5H8zM14 21h4v-9h-4zM20 21h4V9h-4z" fill="#fff" />
    </svg>
  );
}
