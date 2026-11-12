export const STAGES = [
  "Lead",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
] as const;
export type Stage = (typeof STAGES)[number];

export const OPEN_STAGES: readonly Stage[] = ["Lead", "Qualified", "Proposal", "Negotiation"];

export const SOURCES = ["Inbound", "Referral", "Outbound", "Event", "Partner"] as const;
export type Source = (typeof SOURCES)[number];

export const OWNERS = ["Ava Thompson", "Marcus Lee", "Priya Patel", "Jordan Brooks"] as const;

/** ISO calendar date, e.g. "2026-11-12". Lexical order equals chronological order. */
export type ISODate = string;

export interface Deal {
  id: string;
  company: string;
  contact: string;
  email: string;
  /** Deal size in whole US dollars. */
  value: number;
  stage: Stage;
  owner: string;
  source: Source;
  createdAt: ISODate;
  /** Expected close date for open deals, actual close date for Won/Lost. */
  closeDate: ISODate;
  notes: string;
}

/** The fields a user can edit in the form. */
export type DealInput = Omit<Deal, "id" | "createdAt">;

export interface Filters {
  query: string;
  stages: Stage[];
  owner: string; // "all" or an owner name
  source: string; // "all" or a Source
}

export const EMPTY_FILTERS: Filters = { query: "", stages: [], owner: "all", source: "all" };

export type SortKey = "company" | "value" | "stage" | "owner" | "closeDate";
export interface SortState {
  key: SortKey;
  dir: "asc" | "desc";
}
