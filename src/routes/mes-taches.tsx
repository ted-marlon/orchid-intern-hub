import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CheckSquare, Calendar, RefreshCw, ShieldAlert, Clock, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { getAuthToken, getApiUrl } from "@/lib/api/auth";
import { useRouter } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

export const Route = createFileRoute("/mes-taches")({
  head: () => ({
    meta: [
      { title: "Mes Tâches — Orchid Island RH" },
      { name: "description", content: "Consultez vos tâches assignées." },
    ],
  }),
  component: MesTachesPage,
});

type Task = {
  id: number;
  nom: string;
  description: string;
  date_limite: string;
  statut: string;
  statut_affichage: string;
  priorite: string;
  priorite_affichage: string;
  projet_nom: string;
  assignee_a: number;
  realisee: boolean;
  jours_restants: number;
};

function MesTachesPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stagiaireId, setStagiaireId] = useState<number | null>(null);

  // 1. Récupérer les infos utilisateur et l'ID du stagiaire
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
          console.log('📋 Données utilisateur reçues:', data);
          setUserRole(data.role);
          
          if (data.role !== 'stagiaire') {
            router.navigate({ to: "/" });
            return;
          }
          
          // Récupérer l'ID du stagiaire via /api/stagiaires/
          console.log('🔍 Recherche du stagiaire avec email:', data.email);
          
          const stagiairesRes = await fetch(getApiUrl("/api/stagiaires/"), {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (stagiairesRes.ok) {
            const stagiairesData = await stagiairesRes.json();
            const allStagiaires = Array.isArray(stagiairesData) ? stagiairesData : stagiairesData.results || [];
            
            const stagiaire = allStagiaires.find((s: any) => 
              s.user_email === data.email || s.user === data.id
            );
            
            if (stagiaire) {
              console.log('✅ Stagiaire trouvé:', { id: stagiaire.id, email: stagiaire.user_email });
              setStagiaireId(stagiaire.id);
            } else {
              console.error('❌ Stagiaire non trouvé pour cet email');
            }
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

  // 2. Récupérer et filtrer les tâches
  useEffect(() => {
    const fetchTasks = async () => {
      const token = getAuthToken();
      if (!token || stagiaireId === null) {
        console.log('⏳ En attente du token ou du stagiaireId...');
        return;
      }

      try {
        console.log('🚀 Récupération des tâches pour le stagiaire ID:', stagiaireId);
        
        const response = await fetch(getApiUrl("/api/taches/"), {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const allTasks = Array.isArray(data) ? data : data.results || [];
          
          console.log('📦 Total tâches reçues:', allTasks.length);
          
          // Filtrer pour ne garder que les tâches du stagiaire connecté
          const userTasks = allTasks.filter((task: Task) => {
            return task.assignee_a === stagiaireId || task.assignee_a === Number(stagiaireId);
          });
          
          console.log('✅ Tâches filtrées pour ce stagiaire:', userTasks.length);
          setTasks(userTasks);
        } else {
          console.error('❌ Erreur API tâches:', response.status);
        }
      } catch (err) {
        console.error("💥 Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userRole === 'stagiaire' && stagiaireId !== null) {
      fetchTasks();
    }
  }, [userRole, stagiaireId]);

  // 3. Fonctions Helpers (formatDate était manquante ici !)
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

  const getStatutConfig = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return { label: 'En cours', icon: TrendingUp, bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' };
      case 'terminee':
        return { label: 'Terminée', icon: CheckCircle2, bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' };
      case 'a_faire':
        return { label: 'À faire', icon: Clock, bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' };
      default:
        return { label: statut, icon: AlertCircle, bg: 'bg-muted/10', border: 'border-border', text: 'text-muted-foreground' };
    }
  };

  const getPrioriteConfig = (priorite: string) => {
    switch (priorite) {
      case 'haute':
        return { label: 'Haute', bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' };
      case 'moyenne':
        return { label: 'Moyenne', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400' };
      case 'faible':
        return { label: 'Faible', bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' };
      default:
        return { label: priorite, bg: 'bg-muted/10', border: 'border-border', text: 'text-muted-foreground' };
    }
  };

  // 4. Rendus conditionnels
  if (userRole === null || stagiaireId === null) {
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

  // 5. Rendu principal
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Mes Tâches" sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Mes Tâches</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loading ? "Chargement..." : `${tasks.length} tâche${tasks.length > 1 ? 's' : ''} assignée${tasks.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted/50 grid place-items-center">
                <CheckSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Aucune tâche assignée</h3>
              <p className="text-xs text-muted-foreground">
                Vous n'avez pas encore de tâches assignées pour le moment.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {tasks.map((task) => {
                const statutConfig = getStatutConfig(task.statut);
                const StatutIcon = statutConfig.icon;
                const prioriteConfig = getPrioriteConfig(task.priorite);
                const isTerminee = task.statut === 'terminee';
                const isEnRetard = task.jours_restants < 0 && !isTerminee;
                const isUrgent = task.jours_restants >= 0 && task.jours_restants <= 3 && !isTerminee;

                return (
                  <div
                    key={task.id}
                    className={`group rounded-xl border bg-card p-5 transition-all duration-300 ${
                      isEnRetard 
                        ? 'border-red-500/30' 
                        : isTerminee 
                        ? 'border-green-500/20 opacity-70'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className={`text-sm font-semibold text-foreground leading-tight flex-1 ${
                        isTerminee ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {task.nom}
                      </h3>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${statutConfig.bg} ${statutConfig.border} ${statutConfig.text} whitespace-nowrap shrink-0`}>
                        <StatutIcon className="h-3 w-3" />
                        {statutConfig.label}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground mb-2">
                      {task.projet_nom}
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border/60">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${prioriteConfig.bg} ${prioriteConfig.border} ${prioriteConfig.text}`}>
                          {prioriteConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className={`font-medium ${
                          isEnRetard ? 'text-red-400' : isUrgent ? 'text-yellow-400' : 'text-foreground'
                        }`}>
                          {formatDate(task.date_limite)}
                        </span>
                        {!isTerminee && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            isEnRetard 
                              ? 'bg-red-500/10 text-red-400' 
                              : isUrgent 
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-muted/50 text-muted-foreground'
                          }`}>
                            {isEnRetard ? `${Math.abs(task.jours_restants)}j retard` : `${task.jours_restants}j`}
                          </span>
                        )}
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