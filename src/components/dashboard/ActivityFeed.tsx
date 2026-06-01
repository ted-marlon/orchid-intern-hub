import { QrCode, FolderKanban, FileText, UserPlus } from "lucide-react";

const items = [
  { icon: QrCode, title: "Pointage QR effectué", meta: "Test Test", time: "12:47" },
  { icon: FolderKanban, title: "Projet actif", meta: "test", time: "11:20" },
  { icon: UserPlus, title: "Nouvelle candidature", meta: "Yassine A.", time: "10:05" },
  { icon: FileText, title: "Rapport déposé", meta: "Semaine 22", time: "09:12" },
];

export function ActivityFeed() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Activité récente</h3>
        <button className="text-xs text-primary hover:underline">Voir tout →</button>
      </div>
      <ol className="relative space-y-3">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <li key={i} className="flex items-start gap-3 group">
              <div className="h-7 w-7 shrink-0 rounded-md bg-muted/60 grid place-items-center text-muted-foreground group-hover:text-foreground transition-colors">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0 leading-tight">
                <div className="text-sm text-foreground truncate">{it.title}</div>
                <div className="text-xs text-muted-foreground truncate">{it.meta}</div>
              </div>
              <div className="text-xs text-muted-foreground tabular-nums shrink-0">{it.time}</div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
