import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: { value: string; direction: "up" | "down" | "flat"; tone?: "positive" | "negative" | "neutral" };
  icon: LucideIcon;
}

export function KpiCard({ label, value, trend, icon: Icon }: KpiCardProps) {
  const TrendIcon = trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : Minus;
  const trendColor =
    trend?.tone === "positive" ? "text-success" :
    trend?.tone === "negative" ? "text-destructive" :
    "text-muted-foreground";

  return (
    <div className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80 hover:bg-card/80">
      <div className="flex items-start justify-between mb-4">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="h-7 w-7 rounded-md bg-muted/60 grid place-items-center text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{value}</div>
      </div>
      {trend && (
        <div className={`mt-2 inline-flex items-center gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />
          <span className="tabular-nums">{trend.value}</span>
        </div>
      )}
    </div>
  );
}
