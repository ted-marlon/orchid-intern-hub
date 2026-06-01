import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tone = "blue" | "green" | "amber" | "red" | "violet" | "muted";

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: { value: string; direction: "up" | "down" | "flat"; tone?: "positive" | "negative" | "neutral" };
  icon: LucideIcon;
  iconTone?: Tone;
}

const toneClasses: Record<Tone, string> = {
  blue: "bg-primary/15 text-primary ring-1 ring-inset ring-primary/25",
  green: "bg-success/15 text-success ring-1 ring-inset ring-success/25",
  amber: "bg-warning/15 text-warning ring-1 ring-inset ring-warning/25",
  red: "bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/25",
  violet:
    "bg-[oklch(0.68_0.18_295/0.15)] text-[oklch(0.78_0.16_295)] ring-1 ring-inset ring-[oklch(0.68_0.18_295/0.25)]",
  muted: "bg-muted/60 text-muted-foreground",
};

export function KpiCard({ label, value, trend, icon: Icon, iconTone = "muted" }: KpiCardProps) {
  const TrendIcon = trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : Minus;
  const trendColor =
    trend?.tone === "positive" ? "text-success" :
    trend?.tone === "negative" ? "text-destructive" :
    "text-muted-foreground";

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80 hover:bg-card/80">
      <div className="flex items-start justify-between mb-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className={`h-7 w-7 rounded-md grid place-items-center ${toneClasses[iconTone]}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{value}</div>
      </div>
      <div className={`mt-auto pt-3 inline-flex items-center gap-1 text-xs ${trendColor}`}>
        {trend ? (
          <>
            <TrendIcon className="h-3 w-3" />
            <span className="tabular-nums">{trend.value}</span>
          </>
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    </div>
  );
}
