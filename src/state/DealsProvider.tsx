"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { toISODate } from "@/lib/dates";
import { dealsReducer, type DealsState } from "@/lib/dealsReducer";
import { generateSeedDeals } from "@/lib/seed";
import { STAGES, type Deal, type DealInput, type ISODate } from "@/lib/types";

const STORAGE_KEY = "dealflow:deals:v1";

function isDeal(x: unknown): x is Deal {
  if (typeof x !== "object" || x === null) return false;
  const d = x as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.company === "string" &&
    typeof d.value === "number" &&
    typeof d.closeDate === "string" &&
    STAGES.includes(d.stage as Deal["stage"])
  );
}

/** Reads persisted deals; falls back to fresh demo data if storage is empty, blocked or corrupt. */
function loadInitialState(today: ISODate): DealsState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every(isDeal)) return { deals: parsed };
    }
  } catch {
    // Private mode or blocked storage: run in-memory only.
  }
  return { deals: generateSeedDeals(today) };
}

interface DealsContextValue {
  deals: Deal[];
  today: ISODate;
  addDeal: (input: DealInput) => Deal;
  updateDeal: (id: string, changes: Partial<DealInput>) => void;
  /** Deletes a deal and returns a function that undoes the deletion. */
  deleteDeal: (id: string) => () => void;
  /** Restores the demo dataset and returns a function that brings the previous data back. */
  resetDemo: () => () => void;
}

const DealsContext = createContext<DealsContextValue | null>(null);

export function DealsProvider({ children }: { children: React.ReactNode }) {
  // `today` is fixed for the session so derived data doesn't shift at midnight mid-edit.
  const [today] = useState(() => toISODate(new Date()));
  // This component only renders on the client (see DashboardLoader), so the lazy
  // initializer can read localStorage directly — no hydration mismatch, no effect.
  const [state, dispatch] = useReducer(dealsReducer, today, loadInitialState);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.deals));
    } catch {
      // Storage full or blocked; the app keeps working in memory.
    }
  }, [state.deals]);

  const addDeal = useCallback(
    (input: DealInput) => {
      const deal: Deal = { ...input, id: crypto.randomUUID(), createdAt: today };
      dispatch({ type: "add", deal });
      return deal;
    },
    [today],
  );

  const updateDeal = useCallback((id: string, changes: Partial<DealInput>) => {
    dispatch({ type: "update", id, changes });
  }, []);

  const deleteDeal = useCallback(
    (id: string) => {
      const index = state.deals.findIndex((d) => d.id === id);
      if (index === -1) return () => {};
      const deal = state.deals[index];
      dispatch({ type: "delete", id });
      return () => dispatch({ type: "restore", deal, index });
    },
    [state.deals],
  );

  const resetDemo = useCallback(() => {
    const previous = state.deals;
    dispatch({ type: "reset", deals: generateSeedDeals(today) });
    return () => dispatch({ type: "reset", deals: previous });
  }, [state.deals, today]);

  const value = useMemo(
    () => ({ deals: state.deals, today, addDeal, updateDeal, deleteDeal, resetDemo }),
    [state.deals, today, addDeal, updateDeal, deleteDeal, resetDemo],
  );

  return <DealsContext.Provider value={value}>{children}</DealsContext.Provider>;
}

export function useDeals(): DealsContextValue {
  const ctx = useContext(DealsContext);
  if (!ctx) throw new Error("useDeals must be used inside <DealsProvider>");
  return ctx;
}
