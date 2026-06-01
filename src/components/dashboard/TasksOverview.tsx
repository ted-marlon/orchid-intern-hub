const tasks = [
  { title: "Revoir rapport hebdo — Yassine", due: "Aujourd'hui", status: "todo" },
  { title: "Valider candidature Sara M.", due: "Aujourd'hui", status: "in_progress" },
  { title: "Brief projet Marina Bay", due: "Demain", status: "todo" },
  { title: "Pointage QR équipe terrain", due: "Mer.", status: "done" },
];

const statusMap = {
  todo: { label: "À faire", className: "bg-muted/60 text-muted-foreground" },
  in_progress: { label: "En cours", className: "bg-primary/15 text-primary" },
  done: { label: "Terminé", className: "bg-success/15 text-success" },
} as const;

export function TasksOverview() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Tâches à venir</h3>
          <p className="text-xs text-muted-foreground mt-0.5">4 tâches assignées</p>
        </div>
        <button className="text-xs text-primary hover:underline">Voir tout →</button>
      </div>
      <ul className="divide-y divide-border">
        {tasks.map((t, i) => {
          const s = statusMap[t.status as keyof typeof statusMap];
          return (
            <li key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
              <input
                type="checkbox"
                defaultChecked={t.status === "done"}
                className="h-3.5 w-3.5 rounded border-border bg-transparent text-primary focus:ring-1 focus:ring-ring"
              />
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${t.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {t.title}
                </div>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline">{t.due}</span>
              <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded ${s.className}`}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
