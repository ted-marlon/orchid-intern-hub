import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Users, UserCheck, FolderKanban, FileText, Bell } from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { CandidaturesCard } from "@/components/dashboard/CandidaturesCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { TasksOverview } from "@/components/dashboard/TasksOverview";
import { RecentInterns } from "@/components/dashboard/RecentInterns";

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
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/dashboard-stats/')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      });
  }, []);

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
