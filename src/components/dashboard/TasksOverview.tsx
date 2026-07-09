import { useState, useEffect } from "react";
import { getAuthToken, getApiUrl } from "@/lib/api/auth";

type TacheAPI = {
  id: number;
  titre?: string;
  nom?: string;
  description?: string;
  assigne_a?: number;
  assigne_a_nom?: string;
  stagiaire?: number;
  stagiaire_nom?: string;
  date_echeance?: string;
  date_limite?: string;
  statut?: string;
  etat?: string;
  priorite?: string;
};

type Task = {
  id: number;
  title: string;
  due: string;
  status: "todo" | "in_progress" | "done";
};

const statusMap = {
  todo: { label: "À faire", className: "bg-muted/60 text-muted-foreground" },
  in_progress: { label: "En cours", className: "bg-primary/15 text-primary" },
  done: { label: "Terminé", className: "bg-success/15 text-success" },
} as const;

export function TasksOverview() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(getApiUrl('/api/taches/'), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const rawTasks: TacheAPI[] = Array.isArray(data) ? data : data.results || [];
          
          // Mapper les tâches de l'API vers le format du composant
          const mapped: Task[] = rawTasks.slice(0, 4).map((t) => {
            // Titre : utiliser titre, nom ou description
            const title = t.titre || t.nom || t.description || "Tâche sans titre";
            
            // Statut : mapper depuis l'API
            const apiStatus = (t.statut || t.etat || "todo").toLowerCase();
            let status: "todo" | "in_progress" | "done" = "todo";
            
            if (apiStatus.includes("termine") || apiStatus === "done" || apiStatus === "fait") {
              status = "done";
            } else if (apiStatus.includes("cours") || apiStatus === "in_progress" || apiStatus === "progress") {
              status = "in_progress";
            }
            
            // Date d'échéance : formater
            const dueDate = t.date_echeance || t.date_limite;
            let due = "—";
            if (dueDate) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const dateEcheance = new Date(dueDate);
              dateEcheance.setHours(0, 0, 0, 0);
              
              const diffTime = dateEcheance.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 0) {
                due = "Aujourd'hui";
              } else if (diffDays === 1) {
                due = "Demain";
              } else if (diffDays === -1) {
                due = "Hier";
              } else if (diffDays < 0) {
                due = "En retard";
              } else if (diffDays < 7) {
                due = `${diffDays} jours`;
              } else {
                due = dateEcheance.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
              }
            }
            
            return {
              id: t.id,
              title,
              due,
              status,
            };
          });
          
          setTasks(mapped);
        } else {
          console.error('Erreur chargement tâches:', res.status);
        }
      } catch (err) {
        console.error('Erreur fetch tâches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Tâches à venir</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? "Chargement..." : `${tasks.length} tâche${tasks.length > 1 ? 's' : ''} assignée${tasks.length > 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
      <ul className="divide-y divide-border">
        {loading ? (
          <li className="px-5 py-8 text-center text-xs text-muted-foreground">
            Chargement...
          </li>
        ) : tasks.length === 0 ? (
          <li className="px-5 py-8 text-center text-xs text-muted-foreground">
            Aucune tâche à afficher
          </li>
        ) : (
          tasks.map((t) => {
            const s = statusMap[t.status];
            return (
              <li key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
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
          })
        )}
      </ul>
    </div>
  );
}
