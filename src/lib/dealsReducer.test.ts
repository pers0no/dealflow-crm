import { describe, expect, it } from "vitest";
import { dealsReducer, type DealsState } from "./dealsReducer";
import type { Deal } from "./types";

const deal = (id: string, overrides: Partial<Deal> = {}): Deal => ({
  id,
  company: `Company ${id}`,
  contact: "Jane Doe",
  email: "jane@example.com",
  value: 1000,
  stage: "Lead",
  owner: "Ava Thompson",
  source: "Inbound",
  createdAt: "2026-01-01",
  closeDate: "2026-02-01",
  notes: "",
  ...overrides,
});

const state = (): DealsState => ({ deals: [deal("a"), deal("b"), deal("c")] });

describe("dealsReducer", () => {
  it("adds new deals to the top of the list", () => {
    const next = dealsReducer(state(), { type: "add", deal: deal("z") });
    expect(next.deals.map((d) => d.id)).toEqual(["z", "a", "b", "c"]);
  });

  it("updates only the targeted deal and does not mutate the previous state", () => {
    const prev = state();
    const next = dealsReducer(prev, { type: "update", id: "b", changes: { stage: "Won", value: 5000 } });
    expect(next.deals[1]).toMatchObject({ id: "b", stage: "Won", value: 5000 });
    expect(prev.deals[1].stage).toBe("Lead");
    expect(next.deals[0]).toBe(prev.deals[0]); // untouched rows keep identity
  });

  it("returns the same state object when updating or deleting an unknown id", () => {
    const prev = state();
    expect(dealsReducer(prev, { type: "update", id: "nope", changes: { value: 1 } })).toBe(prev);
    expect(dealsReducer(prev, { type: "delete", id: "nope" })).toBe(prev);
  });

  it("restores a deleted deal at its original position (undo)", () => {
    const prev = state();
    const deleted = dealsReducer(prev, { type: "delete", id: "b" });
    expect(deleted.deals.map((d) => d.id)).toEqual(["a", "c"]);
    const restored = dealsReducer(deleted, { type: "restore", deal: prev.deals[1], index: 1 });
    expect(restored.deals.map((d) => d.id)).toEqual(["a", "b", "c"]);
  });

  it("ignores a restore when the deal already exists", () => {
    const prev = state();
    expect(dealsReducer(prev, { type: "restore", deal: prev.deals[0], index: 2 })).toBe(prev);
  });

  it("replaces everything on reset", () => {
    const next = dealsReducer(state(), { type: "reset", deals: [deal("x")] });
    expect(next.deals.map((d) => d.id)).toEqual(["x"]);
  });
});
