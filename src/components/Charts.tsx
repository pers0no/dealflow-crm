"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMonthLong, formatMonthShort, formatUSD, formatUSDCompact } from "@/lib/format";
import type { MonthBucket, StageBucket } from "@/lib/selectors";
import { Card } from "./ui";

const AXIS_TICK = { fill: "var(--muted)", fontSize: 12 };

function ChartTooltip({ title, value, count, note }: { title: string; value: number; count: number; note?: string }) {
  return (
    <div className="rounded-lg border border-line bg-card px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-0.5 flex items-center gap-2 text-ink-2">
        <span aria-hidden className="size-2 rounded-full" style={{ background: "var(--series-1)" }} />
        <span className="font-medium tabular-nums text-ink">{formatUSD(value)}</span>
        <span className="text-muted">
          · {count} {count === 1 ? "deal" : "deals"}
        </span>
      </p>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
    </div>
  );
}

function ChartCard({ title, subtitle, summary, children, className = "", empty }: {
  title: string;
  subtitle: string;
  summary: string;
  children: React.ReactNode;
  className?: string;
  /** Shown over the plot when there's nothing to draw for the current filters. */
  empty?: string;
}) {
  return (
    <Card className={`p-4 ${className}`}>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="text-xs text-muted">{subtitle}</p>
      {/* The chart is visual; screen readers get a text summary (the full data is in the table). */}
      <div role="img" aria-label={summary} className="relative mt-4">
        {children}
        {empty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="rounded-md bg-card px-3 py-1.5 text-sm text-muted">{empty}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

export function RevenueChart({ data, className }: { data: MonthBucket[]; className?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const best = data.reduce((a, b) => (b.value > a.value ? b : a), data[0]);
  const current = data[data.length - 1]?.month;
  const summary =
    total === 0
      ? "No closed-won revenue in the last 12 months for the current filters."
      : `Closed-won revenue by month. Total ${formatUSD(total)}; best month ${formatMonthLong(best.month)} at ${formatUSD(best.value)}.`;

  return (
    <ChartCard
      title="Closed-won revenue"
      subtitle={`Last 12 months · ${formatUSD(total)} total`}
      summary={summary}
      className={className}
      empty={total === 0 ? "No closed-won deals match these filters" : undefined}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--grid)" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonthShort}
            tick={AXIS_TICK}
            axisLine={{ stroke: "var(--line-strong)" }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={8}
          />
          <YAxis
            tickFormatter={(v: number) => formatUSDCompact(v)}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={52}
            // Keep a sensible scale when everything is zero; otherwise let Recharts pick round ticks.
            domain={total === 0 ? [0, 10_000] : [0, "auto"]}
          />
          <Tooltip
            cursor={{ fill: "var(--hover)" }}
            content={({ active, payload }) => {
              const p = active ? (payload?.[0]?.payload as MonthBucket | undefined) : undefined;
              if (!p) return null;
              return (
                <ChartTooltip
                  title={formatMonthLong(p.month)}
                  value={p.value}
                  count={p.count}
                  note={p.month === current ? "Month to date" : undefined}
                />
              );
            }}
          />
          <Bar dataKey="value" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PipelineChart({ data, className }: { data: StageBucket[]; className?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const summary =
    total === 0
      ? "No open deals for the current filters."
      : `Open pipeline by stage: ${data.map((d) => `${d.stage} ${formatUSD(d.value)}`).join(", ")}.`;

  return (
    <ChartCard title="Pipeline by stage" subtitle={`Open deals · ${formatUSD(total)} total`} summary={summary}
      className={className}
      empty={total === 0 ? "No open deals match these filters" : undefined}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 0, left: 0 }} barCategoryGap="28%">
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="stage"
            tick={{ ...AXIS_TICK, fill: "var(--ink-2)" }}
            axisLine={{ stroke: "var(--line-strong)" }}
            tickLine={false}
            width={88}
          />
          <Tooltip
            cursor={{ fill: "var(--hover)" }}
            content={({ active, payload }) => {
              const p = active ? (payload?.[0]?.payload as StageBucket | undefined) : undefined;
              if (!p) return null;
              return <ChartTooltip title={p.stage} value={p.value} count={p.count} />;
            }}
          />
          <Bar dataKey="value" fill="var(--series-1)" radius={[0, 4, 4, 0]} maxBarSize={24} isAnimationActive={false}>
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v) => formatUSDCompact(Number(v))}
              style={{ fill: "var(--ink-2)", fontSize: 12, fontWeight: 500 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
