import { addDays } from "./dates";
import { OWNERS, SOURCES, type Deal, type ISODate, type Stage } from "./types";

// All companies and people below are fictional.
const COMPANIES = [
  "Bluepeak Logistics", "Cedar & Pine Dental", "Harborline Freight", "Summit Ridge Health",
  "Lumenfield Solar", "Copperleaf Foods", "Brightwater Labs", "Ironwood Builders",
  "Redfern Media", "Oakmont Realty", "Clearpath Insurance", "Tallgrass Ventures",
  "Silverline Fitness", "Marigold Bakery Co.", "Granite Bay Orthopedics", "Pinecrest Academy",
  "Westbrook Legal", "Foxglove Studio", "Kestrel Robotics", "Driftwood Hospitality",
  "Meridian Payroll", "Bayside Auto Group", "Highland Coffee Roasters", "Juniper HR",
  "Atlas Cold Storage", "Riverbend Clinics", "Quarry Lane Architects", "Sagebrush Outfitters",
  "Evergreen Property Mgmt", "Mesa Verde Wineries", "Lakeshore Credit Union", "Polaris Field Services",
  "Stonegate Manufacturing", "Wildflower Events", "Beacon Hill Tutoring", "Cobalt Cloud Systems",
  "Red Rock Roofing", "Sunbelt HVAC", "Prairie Wind Energy", "Magnolia Home Health",
  "Northgate Analytics", "Tidewater Marine", "Aspen Grove Pediatrics", "Keystone Title Co.",
  "Lighthouse Pet Care", "Canyon Creek Brewing", "Union Square Optics", "Blue Heron Travel",
];

const FIRST = [
  "Emily", "James", "Sophia", "Michael", "Olivia", "Daniel", "Grace", "Ethan", "Chloe", "Ryan",
  "Hannah", "Luis", "Maya", "Noah", "Zoe", "Carlos", "Leah", "Tyler", "Nina", "Owen",
];
const LAST = [
  "Carter", "Nguyen", "Ramirez", "Walsh", "Kim", "Foster", "Bennett", "Diaz", "Morgan", "Patel",
  "Reyes", "Hughes", "Coleman", "Price", "Sullivan", "Ortiz", "Hayes", "Kowalski", "Brooks", "Chen",
];

const NOTES = [
  "",
  "",
  "Asked for a case study from a similar-sized customer.",
  "Budget approved for Q1; waiting on procurement.",
  "Champion is the VP of Ops. CFO joins the next call.",
  "Comparing us against two competitors.",
  "Wants annual billing with a 10% discount.",
  "Security review in progress.",
  "Pilot with one team first, then expand.",
];

/** Small deterministic PRNG (mulberry32) so the demo data is the same on every reset. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STAGE_WEIGHTS: [Stage, number][] = [
  ["Lead", 14],
  ["Qualified", 12],
  ["Proposal", 10],
  ["Negotiation", 7],
  ["Won", 22],
  ["Lost", 13],
];

/**
 * Generates a realistic-looking pipeline relative to `today`, so the charts
 * always show the trailing twelve months no matter when the demo is opened.
 */
export function generateSeedDeals(today: ISODate, count = 72, seed = 42): Deal[] {
  const rand = mulberry32(seed);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
  const between = (min: number, max: number) => Math.floor(min + rand() * (max - min + 1));
  const totalWeight = STAGE_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  const pickStage = (): Stage => {
    let r = rand() * totalWeight;
    for (const [stage, w] of STAGE_WEIGHTS) {
      if ((r -= w) < 0) return stage;
    }
    return "Lead";
  };

  const deals: Deal[] = [];
  for (let i = 0; i < count; i++) {
    const company = COMPANIES[i % COMPANIES.length];
    const first = pick(FIRST);
    const last = pick(LAST);
    const domain = company.toLowerCase().replace(/&/g, "and").replace(/[^a-z]+/g, "") + ".example";
    const stage = pickStage();

    // Log-uniform deal size between ~$3k and ~$150k, rounded to $500.
    const value = Math.round(Math.exp(Math.log(3000) + rand() * Math.log(50)) / 500) * 500;

    let createdAt: ISODate;
    let closeDate: ISODate;
    if (stage === "Won" || stage === "Lost") {
      closeDate = addDays(today, -between(1, 360));
      createdAt = addDays(closeDate, -between(14, 120));
    } else {
      createdAt = addDays(today, -between(3, 120));
      closeDate = addDays(today, between(5, 100));
    }

    deals.push({
      id: `d${String(i + 1).padStart(3, "0")}`,
      company,
      contact: `${first} ${last}`,
      email: `${first}.${last}@${domain}`.toLowerCase(),
      value,
      stage,
      owner: pick(OWNERS),
      source: pick(SOURCES),
      createdAt,
      closeDate,
      notes: pick(NOTES),
    });
  }
  // Newest first, like a real CRM list.
  return deals.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
