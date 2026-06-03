import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search, Plus, LayoutGrid, List, Calendar, MoreHorizontal,
  TrendingUp, AlertTriangle, CheckCircle2, BarChart3, Eye, Pencil, Trash2, X,
} from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";

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

const MOCK: Projet[] = [
  {
    id: "1",
    nom: "Refonte site Orchid Island",
    description: "Modernisation complète de la plateforme commerciale",
    client: "Direction Marketing",
    statut: "En cours",
    priorite: "Haute",
    avancement: 62,
    debut: "01/04/2026",
    echeance: "30/07/2026",
    taches: { done: 18, total: 29 },
    equipe: [
      { initiale: "YB", couleur: "bg-primary/20 text-primary" },
      { initiale: "OE", couleur: "bg-success/20 text-success" },
      { initiale: "MC", couleur: "bg-[oklch(0.68_0.18_295/0.2)] text-[oklch(0.78_0.16_295)]" },
    ],
    departement: "Marketing",
  },
  {
    id: "2",
    nom: "App mobile Pointage QR",
    description: "Application interne de pointage par code QR",
    client: "RH & IT",
    statut: "En cours",
    priorite: "Haute",
    avancement: 38,
    debut: "15/05/2026",
    echeance: "15/09/2026",
    taches: { done: 9, total: 24 },
    equipe: [
      { initiale: "AF", couleur: "bg-success/20 text-success" },
      { initiale: "OE", couleur: "bg-primary/20 text-primary" },
    ],
    departement: "IT",
  },
  {
    id: "3",
    nom: "Campagne lancement Marina",
    description: "Plan de communication 360° résidence Marina",
    client: "Ventes",
    statut: "En retard",
    priorite: "Haute",
    avancement: 45,
    debut: "01/03/2026",
    echeance: "20/05/2026",
    taches: { done: 11, total: 25 },
    equipe: [
      { initiale: "HN", couleur: "bg-warning/20 text-warning" },
      { initiale: "LA", couleur: "bg-destructive/20 text-destructive" },
    ],
    departement: "Marketing",
  },
  {
    id: "4",
    nom: "Migration ERP Comptabilité",
    description: "Bascule vers la nouvelle solution ERP cloud",
    client: "Comptabilité",
    statut: "En pause",
    priorite: "Moyenne",
    avancement: 22,
    debut: "10/02/2026",
    echeance: "30/11/2026",
    taches: { done: 5, total: 22 },
    equipe: [
      { initiale: "ST", couleur: "bg-warning/20 text-warning" },
      { initiale: "AF", couleur: "bg-success/20 text-success" },
    ],
    departement: "Comptabilité",
  },
  {
    id: "5",
    nom: "Audit qualité chantiers Q2",
    description: "Vérification conformité 12 chantiers actifs",
    client: "Projets",
    statut: "Terminé",
    priorite: "Moyenne",
    avancement: 100,
    debut: "01/02/2026",
    echeance: "30/04/2026",
    taches: { done: 18, total: 18 },
    equipe: [
      { initiale: "MC", couleur: "bg-[oklch(0.68_0.18_295/0.2)] text-[oklch(0.78_0.16_295)]" },
      { initiale: "RB", couleur: "bg-primary/20 text-primary" },
    ],
    departement: "Projets",
  },
  {
    id: "6",
    nom: "Onboarding stagiaires été 2026",
    description: "Parcours d'intégration et programme de mentorat",
    client: "RH",
    statut: "En cours",
    priorite: "Basse",
    avancement: 75,
    debut: "01/05/2026",
    echeance: "15/06/2026",
    taches: { done: 12, total: 16 },
    equipe: [
      { initiale: "RB", couleur: "bg-primary/20 text-primary" },
    ],
    departement: "RH",
  },
];

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

  const filtered = useMemo(() => {
    return MOCK.filter((p) => {
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
  }, [query, statut]);

  const kpis = {
    enCours: MOCK.filter((p) => p.statut === "En cours").length,
    enRetard: MOCK.filter((p) => p.statut === "En retard").length,
    termines: MOCK.filter((p) => p.statut === "Terminé").length,
    avgAvancement: Math.round(MOCK.reduce((s, p) => s + p.avancement, 0) / MOCK.length),
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
              <button className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors shadow-sm">
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
          {filtered.length === 0 ? (
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
                        <span className={prioriteBadge(p.priorite)}>{p.priorite}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground truncate">{p.nom}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>
                    </div>
                    <button className="shrink-0 h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
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
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="tabular-nums">{p.taches.done}/{p.taches.total} tâches</span>
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
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{p.departement}</span>
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
                            <button className="h-7 w-7 grid place-items-center rounded-md text-primary/80 hover:text-primary hover:bg-primary/10 transition-colors" title="Voir">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button className="h-7 w-7 grid place-items-center rounded-md text-warning/80 hover:text-warning hover:bg-warning/10 transition-colors" title="Modifier">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button className="h-7 w-7 grid place-items-center rounded-md text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors" title="Supprimer">
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
    </div>
  );
}
