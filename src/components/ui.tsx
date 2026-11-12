import { forwardRef } from "react";
import { STAGES, type Stage } from "@/lib/types";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
  secondary: "bg-card text-ink border border-line-strong hover:bg-hover shadow-sm",
  ghost: "text-ink-2 hover:bg-hover hover:text-ink",
  danger: "text-critical hover:bg-critical-soft",
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "sm" | "md" }
>(function Button({ variant = "secondary", size = "md", className = "", ...props }, ref) {
  const sizing = size === "sm" ? "h-8 px-2.5 text-sm gap-1.5" : "h-9 px-3.5 text-sm gap-2";
  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 ${sizing} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
});

export const STAGE_COLOR: Record<Stage, string> = Object.fromEntries(
  STAGES.map((s) => [s, `var(--stage-${s.toLowerCase()})`]),
) as Record<Stage, string>;

/** Stage pill: identity is carried by the text label; the dot only reinforces it. */
export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-card px-2 py-0.5 text-xs font-medium text-ink-2">
      <span aria-hidden className="size-2 rounded-full" style={{ background: STAGE_COLOR[stage] }} />
      {stage}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      aria-hidden
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent"
    >
      {initials}
    </span>
  );
}

export function Card({ className = "", ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={`rounded-xl border border-line bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)] ${className}`} {...props} />;
}
