import { createFileRoute } from "@tanstack/react-router";
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

function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Tableau de bord" />
        <main className="flex-1 p-6 space-y-6">
          {/* KPIs */}
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard label="Stagiaires" value="1" icon={Users}
              trend={{ value: "+1 ce mois", direction: "up", tone: "positive" }} />
            <KpiCard label="Actifs aujourd'hui" value="100%" icon={UserCheck}
              trend={{ value: "Tous présents", direction: "up", tone: "positive" }} />
            <KpiCard label="Projets en cours" value="1" icon={FolderKanban}
              trend={{ value: "33% avancement", direction: "up", tone: "neutral" }} />
            <KpiCard label="Rapports déposés" value="0" icon={FileText}
              trend={{ value: "1 manquant", direction: "down", tone: "negative" }} />
            <KpiCard label="Alertes non lues" value="0" icon={Bell}
              trend={{ value: "0 critique", direction: "flat", tone: "neutral" }} />
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
