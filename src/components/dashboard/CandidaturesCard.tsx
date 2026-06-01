import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "Acceptés", value: 1, color: "oklch(0.72 0.16 155)" },
  { name: "Refusés", value: 0, color: "oklch(0.63 0.21 22)" },
  { name: "En attente", value: 0, color: "oklch(0.78 0.15 80)" },
];

export function CandidaturesCard() {
  const total = data.reduce((s, d) => s + d.value, 0);
  const display = total === 0 ? [{ name: "—", value: 1, color: "oklch(0.27 0.013 250)" }] : data;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Candidatures</h3>
        <span className="text-xs text-muted-foreground tabular-nums">Total: {total}</span>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={display}
                innerRadius={42}
                outerRadius={58}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {display.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-xl font-semibold tabular-nums">{total}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
        <ul className="flex-1 space-y-2.5">
          {data.map((d) => (
            <li key={d.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-foreground/90">{d.name}</span>
              </span>
              <span className="text-muted-foreground tabular-nums text-xs">{d.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
