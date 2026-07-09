import { useState, useEffect } from "react";
import { getAuthToken, getApiUrl } from "@/lib/api/auth";

type StagiaireAPI = {
  id: number;
  user_prenom: string;
  user_nom: string;
  departement: {
    id: number;
    nom: string;
  };
  date_debut: string;
  date_fin: string;
};

type PresenceAPI = {
  stagiaire: number;
  statut: string;
  date: string;
  heure_entree: string | null;
  heure_sortie: string | null;
};

type Intern = {
  id: number;
  name: string;
  role: string;
  status: string;
  tone: "success" | "destructive" | "warning" | "muted";
};

const toneMap = {
  success: "bg-success/15 text-success",
  destructive: "bg-destructive/15 text-destructive",
  warning: "bg-warning/15 text-warning",
  muted: "bg-muted/15 text-muted-foreground",
} as const;

export function RecentInterns() {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchRecentInterns = async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Fetch stagiaires
      const resStagiaires = await fetch(getApiUrl('/api/stagiaires/'), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // Fetch présences du jour
      const resPresences = await fetch(getApiUrl('/api/presences/'), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (resStagiaires.ok && resPresences.ok) {
        const stagiairesData = await resStagiaires.json();
        const presencesData = await resPresences.json();
        
        const stagiaires: StagiaireAPI[] = Array.isArray(stagiairesData) ? stagiairesData : stagiairesData.results || [];
        const presences: PresenceAPI[] = Array.isArray(presencesData) ? presencesData : presencesData.results || [];
        
        // 🎯 FILTRER uniquement les présences d'aujourd'hui
        const today = new Date().toISOString().split('T')[0]; // Format: "2026-07-09"
        const presencesAujourdhui = presences.filter((p) => p.date === today);
        
        console.log('📊 Présences aujourd\'hui:', presencesAujourdhui);
        
        // Créer un map des présences d'aujourd'hui par stagiaire
        const presenceMap = new Map<number, PresenceAPI>();
        presencesAujourdhui.forEach((p) => {
          presenceMap.set(p.stagiaire, p);
        });
        
        // Trier les stagiaires par date_debut (les plus récents d'abord)
        const sorted = [...stagiaires].sort((a, b) => {
          return new Date(b.date_debut).getTime() - new Date(a.date_debut).getTime();
        });
        
        // Prendre les 4 plus récents
        const recent = sorted.slice(0, 4);
        
        // Mapper vers le format du composant
        const mapped: Intern[] = recent.map((s) => {
          const presence = presenceMap.get(s.id);
          let status = "Absent";
          let tone: "success" | "destructive" | "warning" | "muted" = "destructive";
          
          if (presence) {
            if (presence.statut === 'present') {
              status = "Présent";
              tone = "success";
            } else if (presence.statut === 'ferie') {
              status = "Férié";
              tone = "muted";
            }
          }
          
          return {
            id: s.id,
            name: `${s.user_prenom} ${s.user_nom}`,
            role: s.departement?.nom || "Non assigné",
            status,
            tone,
          };
        });
        
        setInterns(mapped);
      } else {
        console.error('Erreur chargement données:', resStagiaires.status, resPresences.status);
      }
    } catch (err) {
      console.error('Erreur fetch recent interns:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchRecentInterns();
}, []);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between p-5 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Stagiaires récents</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Statut du jour</p>
        </div>
      </div>
      <ul className="divide-y divide-border">
        {loading ? (
          <li className="px-5 py-8 text-center text-xs text-muted-foreground">
            Chargement...
          </li>
        ) : interns.length === 0 ? (
          <li className="px-5 py-8 text-center text-xs text-muted-foreground">
            Aucun stagiaire récent
          </li>
        ) : (
          interns.map((it) => (
            <li key={it.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 grid place-items-center text-primary text-xs font-medium">
                {it.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0 leading-tight">
                <div className="text-sm text-foreground truncate">{it.name}</div>
                <div className="text-xs text-muted-foreground truncate">{it.role}</div>
              </div>
              <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded ${toneMap[it.tone]}`}>
                {it.status}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}