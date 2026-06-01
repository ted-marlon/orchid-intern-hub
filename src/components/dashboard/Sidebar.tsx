import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  QrCode,
  FileText,
  Bell,
  LogOut,
} from "lucide-react";

const nav = [
  { section: "Principal", items: [
    { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/stagiaires", label: "Stagiaires", icon: Users, badge: 1 },
    { to: "/projets", label: "Projets", icon: FolderKanban },
    { to: "/taches", label: "Tâches", icon: CheckSquare },
  ]},
  { section: "Gestion", items: [
    { to: "/pointage", label: "Pointage QR", icon: QrCode },
    { to: "/rapports", label: "Rapports", icon: FileText },
    { to: "/alertes", label: "Alertes", icon: Bell },
  ]},
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border">
        <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 grid place-items-center text-primary text-xs font-semibold">
          OI
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-sidebar-foreground">Orchid Island</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Real Estate RH</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {nav.map((group) => (
          <div key={group.section}>
            <div className="px-2 mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {group.section}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.to;
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={`group flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? "text-primary" : ""}`} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Profile */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="flex items-center gap-2.5 px-1">
          <div className="h-8 w-8 rounded-full bg-primary/15 border border-primary/25 grid place-items-center text-primary text-xs font-semibold">
            Ad
          </div>
          <div className="flex-1 min-w-0 leading-tight">
            <div className="text-xs font-medium text-sidebar-foreground truncate">Administrateur</div>
            <div className="text-[11px] text-muted-foreground truncate">md@orchidisland.immo</div>
          </div>
        </div>
        <button className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors py-1.5 rounded-md hover:bg-destructive/10">
          <LogOut className="h-3.5 w-3.5" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
