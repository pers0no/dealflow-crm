"use client";

import { Search, X } from "lucide-react";
import { forwardRef } from "react";
import { OWNERS, SOURCES, STAGES, type Filters, type Stage } from "@/lib/types";
import { Button, STAGE_COLOR } from "./ui";

interface Props {
  filters: Filters;
  stageCounts: Record<Stage, number>;
  isFiltered: boolean;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
}

const selectClass =
  "h-9 rounded-lg border border-line-strong bg-card pl-3 pr-8 text-sm text-ink shadow-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

export const Toolbar = forwardRef<HTMLInputElement, Props>(function Toolbar(
  { filters, stageCounts, isFiltered, onChange, onClear },
  searchRef,
) {
  const toggleStage = (stage: Stage) => {
    const stages = filters.stages.includes(stage)
      ? filters.stages.filter((s) => s !== stage)
      : [...filters.stages, stage];
    onChange({ stages });
  };

  return (
    <div className="flex flex-col gap-3 border-b border-line p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            ref={searchRef}
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ query: e.target.value })}
            placeholder="Search company, contact or email…"
            aria-label="Search deals"
            className="h-9 w-full rounded-lg border border-line-strong bg-card pl-9 pr-16 text-sm text-ink shadow-sm placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.query ? (
            <button
              type="button"
              onClick={() => onChange({ query: "" })}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 font-mono text-[11px] text-muted sm:block">
              /
            </kbd>
          )}
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Filter by owner"
            value={filters.owner}
            onChange={(e) => onChange({ owner: e.target.value })}
            className={`${selectClass} min-w-0 flex-1 md:flex-none`}
          >
            <option value="all">All owners</option>
            {OWNERS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by source"
            value={filters.source}
            onChange={(e) => onChange({ source: e.target.value })}
            className={`${selectClass} min-w-0 flex-1 md:flex-none`}
          >
            <option value="all">All sources</option>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by stage">
        {STAGES.map((stage) => {
          const active = filters.stages.includes(stage);
          return (
            <button
              key={stage}
              type="button"
              aria-pressed={active}
              onClick={() => toggleStage(stage)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring ${
                active
                  ? "border-accent bg-accent-soft font-medium text-ink"
                  : "border-line-strong bg-card text-ink-2 hover:bg-hover"
              }`}
            >
              <span aria-hidden className="size-2 rounded-full" style={{ background: STAGE_COLOR[stage] }} />
              {stage}
              <span className="tabular-nums text-muted">{stageCounts[stage]}</span>
            </button>
          );
        })}
        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="size-3.5" /> Clear filters
          </Button>
        )}
      </div>
    </div>
  );
});
