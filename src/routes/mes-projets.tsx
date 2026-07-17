import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { FolderKanban, Calendar, Clock, RefreshCw, ShieldAlert, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { getAuthToken, getApiUrl } from "@/lib/api/auth";
import { useRouter } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

export const Route = createFileRoute("/mes-projets")({
  head: () => ({
    meta: [
      { title: "Mes Projets — Orchid Island RH" },
      { name: "description", content: "Consultez les projets qui vous sont assignés." },
    ],
  }),
  component: MesProjetsPage,
});

// ✅ CORRECTION : Les noms des champs correspondent maintenant exactement à ton API
type Project = {
  id: number;
  nom: string;               // Était "titre"
  description: string;
  date_debut: string;
  date_limite: string;       // Était "date_fin"
  etat: string;              // Était "statut"
  etat_affichage?: string;
  pourcentage_avancement?: number;
  stagiaires: number[];
};

function MesProjetsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stagiaireId, setStagiaireId] = useState<number | null>(null);

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
        setUserRole(data.role);
        setStagiaireId(data.id); // ✅ Récupérer l'ID du stagiaire
        if (data.role !== 'stagiaire') {
          router.navigate({ to: "/" });
          return;
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

  useEffect(() => {
  const fetchProjects = async () => {
    const token = getAuthToken();
    if (!token || stagiaireId === null) return; // ✅ Attendre que stagiaireId soit disponible

    try {
      const response = await fetch(getApiUrl("/api/projets/"), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const allProjects = Array.isArray(data) ? data : data.results || [];
        
        // ✅ Filtrer pour ne garder que les projets du stagiaire connecté
        const userProjects = allProjects.filter((project: Project) => 
          project.stagiaires.includes(stagiaireId)
        );
        
        setProjects(userProjects);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  if (userRole === 'stagiaire' && stagiaireId !== null) {
    fetchProjects();
  }
}, [userRole, stagiaireId]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Non définie";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Non définie";
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getDaysRemaining = (dateFin: string | null | undefined) => {
    if (!dateFin) return null;
    const today = new Date();
    const end = new Date(dateFin);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (userRole === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (userRole !== 'stagiaire') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Accès refusé</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Cette page est réservée aux stagiaires uniquement.
          </p>
          <button
            onClick={() => router.navigate({ to: "/" })}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const getStatutConfig = (etat: string) => {
    switch (etat) {
      case 'en_cours':
        return {
          label: 'En cours',
          icon: TrendingUp,
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          text: 'text-blue-400',
          dot: 'bg-blue-400'
        };
      case 'termine':
        return {
          label: 'Terminé',
          icon: CheckCircle2,
          bg: 'bg-green-500/10',
          border: 'border-green-500/20',
          text: 'text-green-400',
          dot: 'bg-green-400'
        };
      case 'en_attente':
        return {
          label: 'En attente',
          icon: Clock,
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20',
          text: 'text-yellow-400',
          dot: 'bg-yellow-400'
        };
      default:
        return {
          label: etat,
          icon: AlertCircle,
          bg: 'bg-muted/10',
          border: 'border-border',
          text: 'text-muted-foreground',
          dot: 'bg-muted-foreground'
        };
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Mes Projets" sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Mes Projets</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loading ? "Chargement..." : `${projects.length} projet${projects.length > 1 ? 's' : ''} assigné${projects.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted/50 grid place-items-center">
                <FolderKanban className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Aucun projet assigné</h3>
              <p className="text-xs text-muted-foreground">
                Vous n'avez pas encore de projets assignés pour le moment.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => {
                // ✅ Utilisation de project.etat au lieu de project.statut
                const config = getStatutConfig(project.etat);
                const StatusIcon = config.icon;
                // ✅ Utilisation de project.date_limite au lieu de project.date_fin
                const daysRemaining = getDaysRemaining(project.date_limite);
                const progress = project.pourcentage_avancement || 0;

                return (
      <div
        key={project.id}
        className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300 flex flex-col h-full"
      >
        {/* Header avec statut - Hauteur fixe */}
        <div className="px-5 py-4 border-b border-border/60 bg-gradient-to-br from-muted/30 to-muted/10 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                {project.nom}
              </h3>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full border ${config.bg} ${config.border} ${config.text} whitespace-nowrap shrink-0`}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </span>
          </div>
        </div>

        {/* Contenu - Flex pour remplir l'espace */}
        <div className="p-5 space-y-4 flex-1 flex flex-col">
          {/* Description */}
          <div className="shrink-0">
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {project.description || "Aucune description disponible"}
            </p>
          </div>

          {/* Barre de progression */}
<div className="space-y-1.5 shrink-0">
  <div className="flex items-center justify-between text-[10px]">
    <span className="text-muted-foreground">Avancement</span>
    <span className="font-medium text-foreground">{progress}%</span>
  </div>
  <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-500 ${
        progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : progress >= 25 ? 'bg-yellow-500' : 'bg-red-500'
      }`}
      style={{ width: `${progress}%` }}
    />
  </div>
</div>

          {/* Spacer pour pousser les dates vers le bas */}
          <div className="flex-1" />

          {/* Dates - Toujours en bas */}
          <div className="space-y-2 pt-2 border-t border-border/60 shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground">Début: </span>
                <span className="text-foreground font-medium">{formatDate(project.date_debut)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="text-muted-foreground">Fin: </span>
                <span className="text-foreground font-medium">{formatDate(project.date_limite)}</span>
                {daysRemaining !== null && daysRemaining > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                    daysRemaining <= 7 ? 'bg-red-500/10 text-red-400' : 'bg-muted/50 text-muted-foreground'
                  }`}>
                    {daysRemaining}j
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}