import type { Deal, DealInput } from "./types";

export interface DealsState {
  deals: Deal[];
}

export type DealsAction =
  | { type: "add"; deal: Deal }
  | { type: "update"; id: string; changes: Partial<DealInput> }
  | { type: "delete"; id: string }
  /** Re-insert a deleted deal at its previous position (used by "Undo"). */
  | { type: "restore"; deal: Deal; index: number }
  | { type: "reset"; deals: Deal[] };

/**
 * Pure reducer: every transition returns a new state object and never mutates the
 * previous one, so React can bail out of renders by reference and tests stay trivial.
 */
export function dealsReducer(state: DealsState, action: DealsAction): DealsState {
  switch (action.type) {
    case "add":
      return { deals: [action.deal, ...state.deals] };

    case "update": {
      let found = false;
      const deals = state.deals.map((d) => {
        if (d.id !== action.id) return d;
        found = true;
        return { ...d, ...action.changes };
      });
      return found ? { deals } : state;
    }

    case "delete": {
      const deals = state.deals.filter((d) => d.id !== action.id);
      return deals.length === state.deals.length ? state : { deals };
    }

    case "restore": {
      if (state.deals.some((d) => d.id === action.deal.id)) return state;
      const index = Math.max(0, Math.min(action.index, state.deals.length));
      const deals = [...state.deals];
      deals.splice(index, 0, action.deal);
      return { deals };
    }

    case "reset":
      return { deals: action.deals };
  }
}
