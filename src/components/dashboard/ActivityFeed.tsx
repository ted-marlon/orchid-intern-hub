import { useState, useEffect } from "react";
import { QrCode, FolderKanban, FileText, UserPlus } from "lucide-react";
import { getAuthToken, getApiUrl } from "@/lib/api/auth";

type ActivityItem = {
  id: string;
  icon: typeof QrCode;
  title: string;
  meta: string;
  time: string;
  timestamp: Date;
};

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      try {
        // Fetch en parallèle
        const [presencesRes, rapportsRes, stagiairesRes, projetsRes] = await Promise.all([
          fetch(getApiUrl('/api/presences/'), { headers }),
          fetch(getApiUrl('/api/rapports/journaliers/'), { headers }),
          fetch(getApiUrl('/api/stagiaires/'), { headers }),
          fetch(getApiUrl('/api/projets/'), { headers }),
        ]);

        const activities: ActivityItem[] = [];

        // 1. Pointages QR récents
        if (presencesRes.ok) {
          const presences = await presencesRes.json();
          const presencesList = Array.isArray(presences) ? presences : presences.results || [];
          
          presencesList.slice(0, 2).forEach((p: any) => {
            const date = new Date(`${p.date}T${p.heure_entree || '00:00:00'}`);
            activities.push({
              id: `presence-${p.id}`,
              icon: QrCode,
              title: "Pointage QR effectué",
              meta: `${p.prenom_stagiaire || ''} ${p.nom_stagiaire || ''}`.trim(),
              time: formatTime(date),
              timestamp: date,
            });
          });
        }

        // 2. Rapports déposés
        if (rapportsRes.ok) {
          const rapports = await rapportsRes.json();
          const rapportsList = Array.isArray(rapports) ? rapports : rapports.results || [];
          
          rapportsList.filter((r: any) => r.depose).slice(0, 1).forEach((r: any) => {
            const date = new Date(r.created_at);
            activities.push({
              id: `rapport-${r.id}`,
              icon: FileText,
              title: "Rapport déposé",
              meta: r.nom_stagiaire || "Stagiaire",
              time: formatTime(date),
              timestamp: date,
            });
          });
        }

        // 3. Nouveaux stagiaires (candidatures)
        if (stagiairesRes.ok) {
          const stagiaires = await stagiairesRes.json();
          const stagiairesList = Array.isArray(stagiaires) ? stagiaires : stagiaires.results || [];
          
          // Trier par date_debut décroissant
          const sorted = [...stagiairesList].sort((a: any, b: any) => 
            new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime()
          );
          
          sorted.slice(0, 1).forEach((s: any) => {
            const date = new Date(s.date_debut);
            activities.push({
              id: `stagiaire-${s.id}`,
              icon: UserPlus,
              title: "Nouveau stagiaire",
              meta: `${s.user_prenom} ${s.user_nom}`,
              time: formatTime(date),
              timestamp: date,
            });
          });
        }

        // 4. Projets actifs
        if (projetsRes.ok) {
          const projets = await projetsRes.json();
          const projetsList = Array.isArray(projets) ? projets : projets.results || [];
          
          projetsList.slice(0, 1).forEach((p: any) => {
            const date = new Date(p.date_debut || p.created_at);
            activities.push({
              id: `projet-${p.id}`,
              icon: FolderKanban,
              title: "Projet actif",
              meta: p.nom || "Projet",
              time: formatTime(date),
              timestamp: date,
            });
          });
        }

        // Trier par timestamp décroissant et prendre les 4 plus récents
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivities(activities.slice(0, 4));
        
      } catch (err) {
        console.error('Erreur fetch activités:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Activité récente</h3>
      </div>
      <ol className="relative space-y-3">
        {loading ? (
          <li className="text-xs text-muted-foreground text-center py-4">Chargement...</li>
        ) : activities.length === 0 ? (
          <li className="text-xs text-muted-foreground text-center py-4">Aucune activité récente</li>
        ) : (
          activities.map((it, i) => {
            const Icon = it.icon;
            return (
              <li key={it.id} className="flex items-start gap-3 group">
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
          })
        )}
      </ol>
    </div>
  );
}

// Helper pour formater l'heure
function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
