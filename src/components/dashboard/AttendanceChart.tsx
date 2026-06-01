import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const data = [
  { d: "01", v: 4 }, { d: "05", v: 6 }, { d: "08", v: 5 },
  { d: "12", v: 7 }, { d: "15", v: 8 }, { d: "19", v: 6 },
  { d: "22", v: 9 }, { d: "26", v: 7 }, { d: "30", v: 8 },
];

export function AttendanceChart() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Présences mensuelles</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Évolution sur 30 jours</p>
        </div>
        <select className="text-xs bg-muted/40 border border-border rounded-md px-2 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
          <option>Ce mois</option>
          <option>30 derniers jours</option>
        </select>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.68 0.16 245)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="oklch(0.68 0.16 245)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(0.27 0.013 250)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="d" tick={{ fill: "oklch(0.6 0.018 250)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "oklch(0.6 0.018 250)", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip
              contentStyle={{
                background: "oklch(0.205 0.014 250)",
                border: "1px solid oklch(0.27 0.013 250)",
                borderRadius: 8,
                fontSize: 12,
                color: "oklch(0.97 0.005 240)",
              }}
              cursor={{ stroke: "oklch(0.68 0.16 245)", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke="oklch(0.68 0.16 245)"
              strokeWidth={2}
              fill="url(#att)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
