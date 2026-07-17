import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Users, UserCheck, FolderKanban, FileText, Bell, RefreshCw } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { CandidaturesCard } from "@/components/dashboard/CandidaturesCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { TasksOverview } from "@/components/dashboard/TasksOverview";
import { RecentInterns } from "@/components/dashboard/RecentInterns";
import { getAuthToken, getApiUrl } from "@/lib/api/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Orchid Island RH" },
      { name: "description", content: "Plateforme interne de gestion des stagiaires Orchid Island Real Estate." },
    ],
  }),
  component: Dashboard,
});

interface DashboardStats {
  stagiaires: {
    total: number;
    new_this_month: number;
    message: string;
  };
  actifs_aujourdhui: {
    pourcentage: number;
    message: string;
  };
  projets_en_cours: {
    total: number;
    avancement_moyen: number;
    message: string;
  };
  rapports_deposes: {
    total: number;
    manquants: number;
    message: string;
  };
  alertes_non_lues: {
    total: number;
    critiques: number;
    message: string;
  };
}

function Dashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // 1. Vérifier le rôle de l'utilisateur et rediriger si nécessaire
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = getAuthToken();
      if (!token) {
        router.navigate({ to: "/login" });
        return;
      }

      try {
        const response = await fetch(getApiUrl("/api/users/me/"), {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const role = data.role;
          setUserRole(role);

          // 🚀 Redirection immédiate pour les stagiaires (pas de chargement de stats inutile)
          if (role === 'stagiaire') {
            router.navigate({ to: "/mes-projets" });
          }
        } else {
          router.navigate({ to: "/login" });
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        router.navigate({ to: "/login" });
      }
    };

    fetchUserInfo();
  }, [router]);

  // 2. Charger les statistiques UNIQUEMENT si c'est un Admin/RH
  useEffect(() => {
    if (userRole && userRole !== 'stagiaire') {
      setLoading(true);
      fetch(getApiUrl('/api/dashboard-stats/'), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          setStats(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching dashboard stats:', err);
          setLoading(false);
        });
    }
  }, [userRole]);

  // Afficher un loader pendant la vérification du rôle ou la redirection
  if (userRole === null || userRole === 'stagiaire') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 3. Affichage du Dashboard Admin/RH
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Tableau de bord" sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          {/* KPIs */}
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard
              label="Stagiaires"
              value={loading ? "..." : stats?.stagiaires.total.toString() || "0"}
              icon={Users}
              iconTone="blue"
              trend={{
                value: loading ? "..." : stats?.stagiaires.message || "0 ce mois",
                direction: (stats?.stagiaires.new_this_month ?? 0) > 0 ? "up" : "flat",
                tone: (stats?.stagiaires.new_this_month ?? 0) > 0 ? "positive" : "neutral"
              }}
            />
            <KpiCard 
              label="Actifs aujourd'hui" 
              value={loading ? "..." : `${stats?.actifs_aujourdhui.pourcentage}%` || "0%"} 
              icon={UserCheck} 
              iconTone="green"
              trend={{ 
                value: loading ? "..." : stats?.actifs_aujourdhui.message || "0 absent(s)", 
                direction: stats?.actifs_aujourdhui.pourcentage === 100 ? "up" : "flat", 
                tone: stats?.actifs_aujourdhui.pourcentage === 100 ? "positive" : "neutral" 
              }} 
            />
            <KpiCard 
              label="Projets en cours" 
              value={loading ? "..." : stats?.projets_en_cours.total.toString() || "0"} 
              icon={FolderKanban} 
              iconTone="violet"
              trend={{ 
                value: loading ? "..." : stats?.projets_en_cours.message || "0% avancement", 
                direction: "up", 
                tone: "neutral" 
              }} 
            />
            <KpiCard
              label="Rapports déposés"
              value={loading ? "..." : stats?.rapports_deposes.total.toString() || "0"}
              icon={FileText}
              iconTone="amber"
              trend={{
                value: loading ? "..." : stats?.rapports_deposes.message || "0 manquant(s)",
                direction: (stats?.rapports_deposes.manquants ?? 0) > 0 ? "down" : "up",
                tone: (stats?.rapports_deposes.manquants ?? 0) > 0 ? "negative" : "positive"
              }}
            />
            <KpiCard
              label="Alertes non lues"
              value={loading ? "..." : stats?.alertes_non_lues.total.toString() || "0"}
              icon={Bell}
              iconTone="red"
              trend={{
                value: loading ? "..." : stats?.alertes_non_lues.message || "0 critique",
                direction: (stats?.alertes_non_lues.critiques ?? 0) > 0 ? "down" : "flat",
                tone: (stats?.alertes_non_lues.critiques ?? 0) > 0 ? "negative" : "neutral"
              }}
            />
          </section>

          {/* Main analytics row */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <AttendanceChart />
            </div>
            <CandidaturesCard />
          </section>

          {/* Secondary row */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <TasksOverview />
              <RecentInterns />
            </div>
            <ActivityFeed />
          </section>
        </main>
      </div>
    </div>
  );
}