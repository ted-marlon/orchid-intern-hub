import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  Search, Plus, LayoutGrid, List, Calendar, MoreHorizontal,
  TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Eye, Pencil, Trash2, X,
} from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { NewProjetDialog } from "@/components/projets/NewProjetDialog";
import { getAuthToken, getApiUrl } from "@/lib/api/auth";

export const Route = createFileRoute("/projets")({
  head: () => ({
    meta: [
      { title: "Projets — Orchid Island RH" },
      { name: "description", content: "Suivi et gestion des projets en cours chez Orchid Island Real Estate." },
    ],
  }),
  component: ProjetsPage,
});

type Statut = "En cours" | "En retard" | "Terminé" | "En pause";
type Priorite = "Haute" | "Moyenne" | "Basse";

type Projet = {
  id: string;
  nom: string;
  description: string;
  client: string;
  statut: Statut;
  priorite: Priorite;
  avancement: number;
  debut: string;
  echeance: string;
  taches: { done: number; total: number };
  equipe: { initiale: string; couleur: string }[];
  departement: string;
};

const mapApiProjetToFrontend = (p: any): Projet => {
  // Mapping etat from backend ('en_cours', 'termine', 'en_retard') to frontend ('En cours', 'Terminé', 'En retard', 'En pause')
  let statut: Statut = "En cours";
  if (p.etat === "termine") statut = "Terminé";
  else if (p.etat === "en_retard") statut = "En retard";
  
  // Equipe
  const equipe = (p.stagiaires_details || []).map((s: any) => {
    const initials = `${s.user_prenom?.[0] || ''}${s.user_nom?.[0] || ''}`.toUpperCase() || 'ST';
    const colors = [
      'bg-primary/20 text-primary',
      'bg-success/20 text-success',
      'bg-[oklch(0.68_0.18_295/0.2)] text-[oklch(0.78_0.16_295)]',
      'bg-warning/20 text-warning',
      'bg-destructive/20 text-destructive',
    ];
    const color = colors[parseInt(s.id) % colors.length] || 'bg-primary/20 text-primary';
    return {
      initiale: initials,
      couleur: color,
    };
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const departement = p.stagiaires_details?.[0]?.departement?.nom || "Non assigné";

  const priorites: Priorite[] = ["Basse", "Moyenne", "Haute"];
  const priorite = priorites[p.id % 3] || "Moyenne";

  const totalTasks = 10 + (p.id % 15);
  const doneTasks = Math.round(totalTasks * (p.pourcentage_avancement / 100));

  return {
    id: String(p.id),
    nom: p.nom,
    description: p.description,
    client: p.responsable_nom || "RH & Direction",
    statut,
    priorite,
    avancement: p.pourcentage_avancement || 0,
    debut: formatDate(p.date_debut),
    echeance: formatDate(p.date_limite),
    taches: { done: doneTasks, total: totalTasks },
    equipe,
    departement,
  };
};;

const STATUTS: Statut[] = ["En cours", "En retard", "Terminé", "En pause"];

function statutBadge(s: Statut) {
  const map: Record<Statut, string> = {
    "En cours": "bg-primary/15 text-primary ring-primary/25",
    "En retard": "bg-destructive/15 text-destructive ring-destructive/25",
    "Terminé": "bg-success/15 text-success ring-success/25",
    "En pause": "bg-muted/60 text-muted-foreground ring-border",
  };
  return `inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${map[s]}`;
}

function prioriteBadge(p: Priorite) {
  const map: Record<Priorite, string> = {
    "Haute": "bg-destructive/10 text-destructive ring-destructive/20",
    "Moyenne": "bg-warning/10 text-warning ring-warning/20",
    "Basse": "bg-muted/60 text-muted-foreground ring-border",
  };
  return `inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${map[p]}`;
}

function progressColor(v: number, statut: Statut) {
  if (statut === "Terminé") return "bg-success";
  if (statut === "En retard") return "bg-destructive";
  if (v >= 70) return "bg-success";
  if (v >= 40) return "bg-primary";
  return "bg-warning";
}

function ProjetsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );
  const [query, setQuery] = useState("");
  const [statut, setStatut] = useState<Statut | "Tous">("Tous");
  const [view, setView] = useState<"cartes" | "liste">("cartes");
  const [createOpen, setCreateOpen] = useState(false);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjets = () => {
    setLoading(true);
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    fetch(getApiUrl('/api/projets/'), { headers })
      .then(res => res.json())
      .then(data => {
        const rawList = Array.isArray(data) ? data : data.results || [];
        const mapped = rawList.map(mapApiProjetToFrontend);
        setProjets(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching projets:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProjets();
  }, []);

  const handleDeleteProjet = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;
    
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(getApiUrl(`/api/projets/${id}/`), {
        method: 'DELETE',
        headers,
      });
      
      if (response.ok) {
        fetchProjets();
      } else {
        alert('Erreur lors de la suppression du projet');
      }
    } catch (err) {
      console.error('Error deleting projet:', err);
      alert('Erreur lors de la suppression du projet');
    }
  };

  const filtered = useMemo(() => {
    return projets.filter((p) => {
      if (statut !== "Tous" && p.statut !== statut) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          p.nom.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q) ||
          p.departement.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [query, statut, projets]);

  const kpis = {
    enCours: projets.filter((p) => p.statut === "En cours").length,
    enRetard: projets.filter((p) => p.statut === "En retard").length,
    termines: projets.filter((p) => p.statut === "Terminé").length,
    avgAvancement: projets.length > 0 
      ? Math.round(projets.reduce((s, p) => s + p.avancement, 0) / projets.length) 
      : 0,
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Projets" sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Tous les projets</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} projet{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-md border border-border bg-card p-0.5">
                <button
                  onClick={() => setView("cartes")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[5px] transition-colors ${
                    view === "cartes" ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/25" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Cartes
                </button>
                <button
                  onClick={() => setView("liste")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[5px] transition-colors ${
                    view === "liste" ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/25" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="h-3.5 w-3.5" /> Liste
                </button>
              </div>
              <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm">
                <Plus className="h-3.5 w-3.5" /> Nouveau projet
              </button>
            </div>
          </div>

          {/* KPIs */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="En cours" value={kpis.enCours} icon={TrendingUp} iconTone="blue"
              trend={{ value: `${kpis.enCours} actifs`, direction: "up", tone: "neutral" }} />
            <KpiCard label="En retard" value={kpis.enRetard} icon={AlertTriangle} iconTone="red"
              trend={{ value: kpis.enRetard > 0 ? "Attention requise" : "Aucun retard", direction: kpis.enRetard > 0 ? "down" : "flat", tone: kpis.enRetard > 0 ? "negative" : "positive" }} />
            <KpiCard label="Terminés" value={kpis.termines} icon={CheckCircle2} iconTone="green"
              trend={{ value: "Ce trimestre", direction: "up", tone: "positive" }} />
            <KpiCard label="Avancement moyen" value={`${kpis.avgAvancement}%`} icon={BarChart3} iconTone="violet"
              trend={{ value: "Tous projets", direction: "flat", tone: "neutral" }} />
          </section>

          {/* Filters */}
          <section className="rounded-xl border border-border bg-card p-3 md:p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher un projet, client, département…"
                  className="w-full h-9 pl-9 pr-9 rounded-md bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setStatut("Tous")}
                  className={`shrink-0 px-3 py-1.5 text-xs rounded-md transition-colors ${
                    statut === "Tous" ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/25" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  Tous
                </button>
                {STATUTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatut(s)}
                    className={`shrink-0 px-3 py-1.5 text-xs rounded-md transition-colors ${
                      statut === s ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/25" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Chargement des projets...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/30 py-16 text-center">
              <div className="text-sm text-muted-foreground">Aucun projet ne correspond à votre recherche</div>
            </div>
          ) : view === "cartes" ? (
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <article key={p.id} className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={statutBadge(p.statut)}>{p.statut}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground truncate">{p.nom}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>
                    </div>
                    <button onClick={() => handleDeleteProjet(p.id)} className="shrink-0 h-7 w-7 grid place-items-center rounded-md text-destructive/80 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Avancement</span>
                      <span className="tabular-nums font-medium text-foreground">{p.avancement}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${progressColor(p.avancement, p.statut)}`} style={{ width: `${p.avancement}%` }} />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="tabular-nums">{p.echeance}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground justify-end">
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex -space-x-1.5">
                      {p.equipe.map((m, i) => (
                        <div key={i} className={`h-6 w-6 rounded-full grid place-items-center text-[10px] font-semibold ring-2 ring-card ${m.couleur}`}>
                          {m.initiale}
                        </div>
                      ))}
                    </div>

                  </div>
                </article>
              ))}
            </section>
          ) : (
            <section className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-4 py-2.5">Projet</th>
                      <th className="text-left font-medium px-4 py-2.5">Statut</th>
                      <th className="text-left font-medium px-4 py-2.5 hidden md:table-cell">Avancement</th>
                      <th className="text-left font-medium px-4 py-2.5 hidden lg:table-cell">Échéance</th>
                      <th className="text-left font-medium px-4 py-2.5 hidden lg:table-cell">Équipe</th>
                      <th className="text-right font-medium px-4 py-2.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{p.nom}</div>
                          <div className="text-xs text-muted-foreground">{p.client} · {p.departement}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={statutBadge(p.statut)}>{p.statut}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-2 min-w-[140px]">
                            <div className="h-1.5 flex-1 rounded-full bg-muted/60 overflow-hidden">
                              <div className={`h-full rounded-full ${progressColor(p.avancement, p.statut)}`} style={{ width: `${p.avancement}%` }} />
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground w-9 text-right">{p.avancement}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground tabular-nums">{p.echeance}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex -space-x-1.5">
                            {p.equipe.map((m, i) => (
                              <div key={i} className={`h-6 w-6 rounded-full grid place-items-center text-[10px] font-semibold ring-2 ring-card ${m.couleur}`}>
                                {m.initiale}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button className="h-7 w-7 grid place-items-center rounded-md text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={() => handleDeleteProjet(p.id)} title="Supprimer">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
      <NewProjetDialog open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={fetchProjets} />
    </div>
  );
}
