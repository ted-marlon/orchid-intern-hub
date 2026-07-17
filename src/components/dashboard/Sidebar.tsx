import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { logout, getAuthToken, getApiUrl } from "@/lib/api/auth";
import { useState, useEffect } from "react";
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

type NavItem = {
  to: string;
  label: string;
  icon: any;
  badge?: number;
};

type NavSection = {
  section: string;
  items: NavItem[];
};

const nav: NavSection[] = [
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

const stagiaireNav: NavSection[] = [
  { section: "Mes activités", items: [
    { to: "/mes-projets", label: "Mes projets", icon: FolderKanban },
    { to: "/mes-taches", label: "Mes tâches", icon: CheckSquare },
    { to: "/mes-rapports", label: "Mes rapports", icon: FileText },
  ]},
  { section: "Pointage", items: [
    { to: "/scan-qr", label: "Scanner QR", icon: QrCode },
  ]},
];

type UserInfo = {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  role: string;
};

export function Sidebar({ open = true, onClose }: { open?: boolean; onClose?: () => void }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupérer les infos utilisateur
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(getApiUrl('/api/users/me/'), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          console.error('Erreur chargement profil:', res.status);
        }
      } catch (err) {
        console.error('Erreur fetch profil:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/login" });
  };

  // Générer les initiales dynamiquement
  const getInitials = () => {
    if (!user) return "U";
    const prenom = user.prenom?.[0] || "";
    const nom = user.nom?.[0] || "";
    return (prenom + nom).toUpperCase() || "U";
  };

  // Générer le nom complet
  const getFullName = () => {
    if (!user) return "Utilisateur";
    return `${user.prenom} ${user.nom}`;
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <button
          aria-label="Fermer le menu"
          onClick={onClose}
          className="md:hidden fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
        />
      )}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar overflow-hidden
          transition-[transform,width] duration-200 ease-out
          w-64
          ${open ? "translate-x-0 md:w-60" : "-translate-x-full md:translate-x-0 md:w-0 md:border-r-0"}
        `}
      >
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
          {(user?.role === 'stagiaire' ? stagiaireNav : nav).map((group) => (
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
              {loading ? "..." : getInitials()}
            </div>
            <div className="flex-1 min-w-0 leading-tight">
              <div className="text-xs font-medium text-sidebar-foreground truncate">
                {loading ? "Chargement..." : getFullName()}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {loading ? "..." : user?.email || "Email non disponible"}
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors py-1.5 rounded-md hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}