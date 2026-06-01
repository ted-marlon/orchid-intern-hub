const interns = [
  { name: "Yassine Amrani", role: "Marketing", status: "Présent", tone: "success" },
  { name: "Sara Mansouri", role: "Architecture", status: "Présent", tone: "success" },
  { name: "Karim Bennani", role: "Sales", status: "Absent", tone: "destructive" },
  { name: "Lina El Idrissi", role: "Design", status: "En congé", tone: "warning" },
];

const toneMap = {
  success: "bg-success/15 text-success",
  destructive: "bg-destructive/15 text-destructive",
  warning: "bg-warning/15 text-warning",
} as const;

export function RecentInterns() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Stagiaires récents</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Statut du jour</p>
        </div>
        <button className="text-xs text-primary hover:underline">Voir tout →</button>
      </div>
      <ul className="divide-y divide-border">
        {interns.map((it) => (
          <li key={it.name} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
            <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 grid place-items-center text-primary text-xs font-medium">
              {it.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
              <div className="text-sm text-foreground truncate">{it.name}</div>
              <div className="text-xs text-muted-foreground truncate">{it.role}</div>
            </div>
            <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded ${toneMap[it.tone as keyof typeof toneMap]}`}>
              {it.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
