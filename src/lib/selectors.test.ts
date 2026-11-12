import { describe, expect, it } from "vitest";
import { escapeCsvField, dealsToCsv } from "./csv";
import { lastMonths } from "./dates";
import { generateSeedDeals } from "./seed";
import { computeKpis, filterDeals, pipelineByStage, sortDeals, wonByMonth } from "./selectors";
import { EMPTY_FILTERS, type Deal } from "./types";
import { toDealInput, validateDeal, type FormValues } from "./validation";

const TODAY = "2026-11-12";

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
  closeDate: "2026-12-01",
  notes: "",
  ...overrides,
});

const deals: Deal[] = [
  deal("1", { company: "Bluepeak Logistics", contact: "Emily Carter", value: 12000, stage: "Proposal" }),
  deal("2", { company: "Ironwood Builders", value: 30000, stage: "Won", closeDate: "2026-10-03", owner: "Marcus Lee" }),
  deal("3", { company: "Redfern Media", value: 8000, stage: "Lost", closeDate: "2026-09-20", source: "Referral" }),
  deal("4", { company: "Atlas Cold Storage", value: 20000, stage: "Won", closeDate: "2026-11-02" }),
  deal("5", { company: "Juniper HR", value: 5000, stage: "Lead", email: "ops@juniper.example" }),
  deal("6", { company: "Old Deal Inc", value: 99000, stage: "Won", closeDate: "2025-06-01" }), // > 12 months ago
];

describe("filterDeals", () => {
  it("returns everything with empty filters", () => {
    expect(filterDeals(deals, EMPTY_FILTERS)).toHaveLength(deals.length);
  });

  it("searches company, contact and email case-insensitively, ignoring outer whitespace", () => {
    const ids = (q: string) => filterDeals(deals, { ...EMPTY_FILTERS, query: q }).map((d) => d.id);
    expect(ids("  BLUEPEAK ")).toEqual(["1"]);
    expect(ids("emily")).toEqual(["1"]);
    expect(ids("juniper.example")).toEqual(["5"]);
  });

  it("combines stage, owner and source filters with AND", () => {
    const won = filterDeals(deals, { ...EMPTY_FILTERS, stages: ["Won", "Lost"] });
    expect(won.map((d) => d.id)).toEqual(["2", "3", "4", "6"]);
    const wonByMarcus = filterDeals(deals, { ...EMPTY_FILTERS, stages: ["Won"], owner: "Marcus Lee" });
    expect(wonByMarcus.map((d) => d.id)).toEqual(["2"]);
    expect(filterDeals(deals, { ...EMPTY_FILTERS, source: "Referral" }).map((d) => d.id)).toEqual(["3"]);
  });
});

describe("sortDeals", () => {
  it("sorts by value in both directions without mutating the input", () => {
    const copy = [...deals];
    expect(sortDeals(deals, { key: "value", dir: "desc" })[0].id).toBe("6");
    expect(sortDeals(deals, { key: "value", dir: "asc" })[0].id).toBe("5");
    expect(deals).toEqual(copy);
  });

  it("sorts stages in funnel order, not alphabetically", () => {
    const stages = sortDeals(deals, { key: "stage", dir: "asc" }).map((d) => d.stage);
    expect(stages).toEqual(["Lead", "Proposal", "Won", "Won", "Won", "Lost"]);
  });
});

describe("computeKpis", () => {
  it("computes pipeline, trailing-12-month wins and win rate", () => {
    const k = computeKpis(deals, TODAY);
    expect(k.openValue).toBe(17000);
    expect(k.openCount).toBe(2);
    expect(k.wonValue).toBe(50000); // excludes the deal won 17 months ago
    expect(k.wonCount).toBe(2);
    expect(k.winRate).toBeCloseTo(2 / 3);
    expect(k.avgWonDeal).toBe(25000);
  });

  it("returns null ratios instead of NaN when nothing has closed", () => {
    const k = computeKpis([deal("x")], TODAY);
    expect(k.winRate).toBeNull();
    expect(k.avgWonDeal).toBeNull();
  });
});

describe("chart series", () => {
  it("buckets open value by stage in funnel order, including empty stages", () => {
    expect(pipelineByStage(deals)).toEqual([
      { stage: "Lead", count: 1, value: 5000 },
      { stage: "Qualified", count: 0, value: 0 },
      { stage: "Proposal", count: 1, value: 12000 },
      { stage: "Negotiation", count: 0, value: 0 },
    ]);
  });

  it("returns 12 monthly buckets ending in the current month", () => {
    const months = wonByMonth(deals, TODAY);
    expect(months).toHaveLength(12);
    expect(months[0].month).toBe("2025-12");
    expect(months.at(-1)).toEqual({ month: "2026-11", value: 20000, count: 1 });
    expect(months.find((m) => m.month === "2026-10")?.value).toBe(30000);
  });

  it("handles year boundaries in lastMonths", () => {
    expect(lastMonths("2026-02-15", 3)).toEqual(["2025-12", "2026-01", "2026-02"]);
  });
});

describe("seed data", () => {
  it("is deterministic and internally consistent", () => {
    const a = generateSeedDeals(TODAY);
    expect(a).toEqual(generateSeedDeals(TODAY));
    expect(new Set(a.map((d) => d.id)).size).toBe(a.length);
    for (const d of a) {
      expect(d.value).toBeGreaterThan(0);
      if (d.stage === "Won" || d.stage === "Lost") expect(d.closeDate <= TODAY).toBe(true);
      else expect(d.closeDate > TODAY).toBe(true);
    }
  });
});

describe("validation", () => {
  const valid: FormValues = {
    company: " Acme ",
    contact: "Jane Doe",
    email: "Jane@Acme.com",
    value: "$25,000",
    stage: "Lead",
    owner: "Ava Thompson",
    source: "Inbound",
    closeDate: "2026-12-01",
    notes: "",
  };

  it("accepts a valid form and normalizes it", () => {
    expect(validateDeal(valid, TODAY)).toEqual({});
    expect(toDealInput(valid)).toMatchObject({ company: "Acme", email: "jane@acme.com", value: 25000 });
  });

  it("reports each invalid field", () => {
    const errors = validateDeal({ ...valid, company: "", email: "nope", value: "-5" }, TODAY);
    expect(Object.keys(errors).sort()).toEqual(["company", "email", "value"]);
  });

  it("rejects closed deals with a future close date", () => {
    expect(validateDeal({ ...valid, stage: "Won" }, TODAY).closeDate).toBeDefined();
  });
});

describe("CSV export", () => {
  it("quotes commas/quotes and neutralizes formula injection", () => {
    expect(escapeCsvField('Cedar, "Pine"')).toBe('"Cedar, ""Pine"""');
    expect(escapeCsvField("=HYPERLINK()")).toBe("'=HYPERLINK()");
    expect(dealsToCsv([deals[0]]).split("\r\n")).toHaveLength(2);
  });
});
