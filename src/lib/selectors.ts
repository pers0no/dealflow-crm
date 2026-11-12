import { lastMonths, monthKey } from "./dates";
import { OPEN_STAGES, STAGES, type Deal, type Filters, type ISODate, type SortState, type Stage } from "./types";

const isOpen = (d: Deal) => OPEN_STAGES.includes(d.stage);

export function filterDeals(deals: Deal[], filters: Filters): Deal[] {
  const q = filters.query.trim().toLowerCase();
  return deals.filter((d) => {
    if (filters.stages.length > 0 && !filters.stages.includes(d.stage)) return false;
    if (filters.owner !== "all" && d.owner !== filters.owner) return false;
    if (filters.source !== "all" && d.source !== filters.source) return false;
    if (q) {
      const haystack = `${d.company} ${d.contact} ${d.email}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.stages.length > 0 ||
    filters.owner !== "all" ||
    filters.source !== "all"
  );
}

const stageRank = (s: Stage) => STAGES.indexOf(s);

/** Returns a sorted copy. Ties fall back to company name so the order is deterministic. */
export function sortDeals(deals: Deal[], sort: SortState): Deal[] {
  const dir = sort.dir === "asc" ? 1 : -1;
  const byCompany = (a: Deal, b: Deal) => a.company.localeCompare(b.company);
  const compare = (a: Deal, b: Deal): number => {
    switch (sort.key) {
      case "value":
        return a.value - b.value;
      case "stage":
        return stageRank(a.stage) - stageRank(b.stage);
      case "closeDate":
        return a.closeDate.localeCompare(b.closeDate);
      case "owner":
        return a.owner.localeCompare(b.owner);
      case "company":
        return byCompany(a, b);
    }
  };
  return [...deals].sort((a, b) => compare(a, b) * dir || byCompany(a, b));
}

/** Number of deals per stage, used for the counts on the stage filter chips. */
export function countByStage(deals: Deal[]): Record<Stage, number> {
  const counts = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
  for (const d of deals) counts[d.stage]++;
  return counts;
}

export interface Kpis {
  openValue: number;
  openCount: number;
  wonValue: number; // closed-won in the trailing 12 months
  wonCount: number;
  winRate: number | null; // won / (won + lost); null when nothing has closed
  avgWonDeal: number | null;
}

export function computeKpis(deals: Deal[], today: ISODate): Kpis {
  // Same window as the revenue chart (12 calendar months incl. the current one) so the numbers agree.
  const windowStart = `${lastMonths(today, 12)[0]}-01`;
  let openValue = 0,
    openCount = 0,
    wonValue = 0,
    wonCount = 0,
    lostCount = 0;

  for (const d of deals) {
    if (isOpen(d)) {
      openValue += d.value;
      openCount++;
    } else if (d.closeDate >= windowStart && d.closeDate <= today) {
      if (d.stage === "Won") {
        wonValue += d.value;
        wonCount++;
      } else {
        lostCount++;
      }
    }
  }

  const closed = wonCount + lostCount;
  return {
    openValue,
    openCount,
    wonValue,
    wonCount,
    winRate: closed ? wonCount / closed : null,
    avgWonDeal: wonCount ? Math.round(wonValue / wonCount) : null,
  };
}

export interface StageBucket {
  stage: Stage;
  value: number;
  count: number;
}

/** Open pipeline value per open stage, in funnel order (empty stages included). */
export function pipelineByStage(deals: Deal[]): StageBucket[] {
  return OPEN_STAGES.map((stage) => {
    const inStage = deals.filter((d) => d.stage === stage);
    return { stage, count: inStage.length, value: inStage.reduce((s, d) => s + d.value, 0) };
  });
}

export interface MonthBucket {
  month: string; // "2026-11"
  value: number;
  count: number;
}

/** Closed-won revenue per calendar month for the trailing `months` months. */
export function wonByMonth(deals: Deal[], today: ISODate, months = 12): MonthBucket[] {
  const keys = lastMonths(today, months);
  const buckets = new Map(keys.map((k) => [k, { month: k, value: 0, count: 0 }]));
  for (const d of deals) {
    if (d.stage !== "Won" || d.closeDate > today) continue;
    const bucket = buckets.get(monthKey(d.closeDate));
    if (bucket) {
      bucket.value += d.value;
      bucket.count++;
    }
  }
  return keys.map((k) => buckets.get(k)!);
}
