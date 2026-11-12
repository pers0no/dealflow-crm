import { formatPercent, formatUSD, formatUSDCompact } from "@/lib/format";
import type { Kpis } from "@/lib/selectors";
import { Card } from "./ui";

export function KpiCards({ kpis }: { kpis: Kpis }) {
  const items = [
    {
      label: "Open pipeline",
      value: formatUSDCompact(kpis.openValue),
      title: formatUSD(kpis.openValue),
      hint: `${kpis.openCount} open ${kpis.openCount === 1 ? "deal" : "deals"}`,
    },
    {
      label: "Closed won",
      value: formatUSDCompact(kpis.wonValue),
      title: formatUSD(kpis.wonValue),
      hint: `${kpis.wonCount} ${kpis.wonCount === 1 ? "deal" : "deals"} · last 12 months`,
    },
    {
      label: "Win rate",
      value: kpis.winRate === null ? "—" : formatPercent(kpis.winRate),
      hint: "Won ÷ closed, last 12 months",
    },
    {
      label: "Avg. won deal",
      value: kpis.avgWonDeal === null ? "—" : formatUSDCompact(kpis.avgWonDeal),
      title: kpis.avgWonDeal === null ? undefined : formatUSD(kpis.avgWonDeal),
      hint: "Mean size of closed-won deals",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-4" aria-label={item.label}>
          <p className="text-sm text-ink-2">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl" title={item.title}>
            {item.value}
          </p>
          <p className="mt-1 text-xs text-muted">{item.hint}</p>
        </Card>
      ))}
    </div>
  );
}
