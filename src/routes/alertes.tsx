import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bell, AlertCircle, CheckCircle2, AlertTriangle, Info,
  Search, Filter, X, Clock, Trash2, MoreHorizontal,
  Calendar, MapPin, FileText, CheckCircle,
} from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";

export const Route = createFileRoute("/alertes")({
  head: () => ({
    meta: [
      { title: "Alertes — Orchid Island RH" },
      { name: "description", content: "Centre de gestion des alertes et justifications des stagiaires d'Orchid Island Real Estate." },
    ],
  }),
  component: AlertesPage,
});

/* ------------------------ Types & mock data ------------------------ */

type SeveriteAlerte = "critique" | "avertissement" | "info";
type StatutAlerte = "non-lue" | "lue" | "résolue";

type Alerte = {
  id: string;
  systeme: string;
  titre: string;
  description: string;
  severite: SeveriteAlerte;
  statut: StatutAlerte;
  date: string;
  heure: string;
  stagiaire?: string;
  source?: string;
};

type Justification = {
  id: string;
  stagiaireId: string;
  stagiaire: string;
  initiale: string;
  couleur: string;
  type: "absence" | "retard" | "congé";
  date: string;
  motif: string;
  statut: "en-attente" | "acceptée" | "rejetée";
  piecesJointes?: number;
};

const ALERTES: Alerte[] = [
  {
    id: "a1",
    systeme: "Système",
    titre: "1 stagiaire(s) sans rapport",
    description: "Les stagiaires suivants n'ont pas déposé leur rapport du 20/05/2026: Ted-marlon OGOULA",
    severite: "critique",
    statut: "non-lue",
    date: "20/05/2026",
    heure: "17:45",
    source: "Système de rapports",
  },
  {
    id: "a2",
    systeme: "Pointage",
    titre: "Anomalie détectée",
    description: "Youssef Bennani - Pointage en doublon le 19/05/2026 à 08:30",
    severite: "avertissement",
    statut: "lue",
    date: "19/05/2026",
    heure: "09:15",
    source: "QR Pointage",
  },
  {
    id: "a3",
    systeme: "Gestion",
    titre: "Fin de stage approchante",
    description: "Oumaima El Idrissi termine son stage dans 5 jours (25/06/2026). Préparez l'évaluation finale.",
    severite: "info",
    statut: "lue",
    date: "10/06/2026",
    heure: "08:00",
    source: "Planification",
  },
  {
    id: "a4",
    systeme: "Tâches",
    titre: "Tâche échue",
    description: "La tâche 'Refonte API' est en retard de 3 jours. Assignée à: Mehdi Cherkaoui",
    severite: "avertissement",
    statut: "non-lue",
    date: "08/06/2026",
    heure: "14:30",
    source: "Gestion des tâches",
  },
  {
    id: "a5",
    systeme: "Système",
    titre: "Mise à jour disponible",
    description: "Une nouvelle version de l'application est disponible. Veuillez mettre à jour pour accéder aux dernières fonctionnalités.",
    severite: "info",
    statut: "lue",
    date: "07/06/2026",
    heure: "11:20",
    source: "Système",
  },
];

const JUSTIFICATIONS: Justification[] = [
  {
    id: "j1",
    stagiaireId: "tm",
    stagiaire: "Ted-marlon OGOULA",
    initiale: "TM",
    couleur: "bg-primary/20 text-primary ring-primary/30",
    type: "absence",
    date: "20/05/2026",
    motif: "Visite médicale",
    statut: "en-attente",
    piecesJointes: 1,
  },
  {
    id: "j2",
    stagiaireId: "yb",
    stagiaire: "Youssef Bennani",
    initiale: "YB",
    couleur: "bg-primary/20 text-primary ring-primary/30",
    type: "retard",
    date: "18/05/2026",
    motif: "Transport défaillant",
    statut: "en-attente",
  },
  {
    id: "j3",
    stagiaireId: "oe",
    stagiaire: "Oumaima El Idrissi",
    initiale: "OE",
    couleur: "bg-success/20 text-success ring-success/30",
    type: "congé",
    date: "15/05/2026",
    motif: "Congé familial autorisé",
    statut: "en-attente",
    piecesJointes: 2,
  },
  {
    id: "j4",
    stagiaireId: "mc",
    stagiaire: "Mehdi Cherkaoui",
    initiale: "MC",
    couleur: "bg-[oklch(0.68_0.18_295/0.2)] text-[oklch(0.78_0.16_295)] ring-[oklch(0.68_0.18_295/0.35)]",
    type: "absence",
    date: "14/05/2026",
    motif: "Problème personnel",
    statut: "en-attente",
  },
  {
    id: "j5",
    stagiaireId: "af",
    stagiaire: "Aya Fassi",
    initiale: "AF",
    couleur: "bg-success/20 text-success ring-success/30",
    type: "retard",
    date: "12/05/2026",
    motif: "Embouteillage",
    statut: "en-attente",
  },
  {
    id: "j6",
    stagiaireId: "hn",
    stagiaire: "Hamza Naciri",
    initiale: "HN",
    couleur: "bg-warning/20 text-warning ring-warning/30",
    type: "absence",
    date: "10/05/2026",
    motif: "Maladie",
    statut: "en-attente",
    piecesJointes: 1,
  },
];

const TODAY = "2026-06-10";

/* ------------------------ Helpers ------------------------ */

function severiteMeta(s: SeveriteAlerte) {
  switch (s) {
    case "critique":
      return { chip: "bg-destructive/15 text-destructive ring-destructive/30", icon: AlertTriangle, color: "text-destructive", bgIcon: "bg-destructive/15 ring-destructive/25" };
    case "avertissement":
      return { chip: "bg-warning/15 text-warning ring-warning/30", icon: AlertCircle, color: "text-warning", bgIcon: "bg-warning/15 ring-warning/25" };
    case "info":
      return { chip: "bg-primary/15 text-primary ring-primary/30", icon: Info, color: "text-primary", bgIcon: "bg-primary/15 ring-primary/25" };
    default:
      return { chip: "bg-muted/60 text-muted-foreground ring-border", icon: AlertCircle, color: "text-muted-foreground", bgIcon: "bg-muted/15 ring-border" };
  }
}

function statutJustificationMeta(s: string) {
  switch (s) {
    case "acceptée":
      return { chip: "bg-success/15 text-success ring-success/30", dot: "bg-success", icon: CheckCircle2 };
    case "rejetée":
      return { chip: "bg-destructive/15 text-destructive ring-destructive/30", dot: "bg-destructive", icon: AlertCircle };
    case "en-attente":
    default:
      return { chip: "bg-primary/15 text-primary ring-primary/30", dot: "bg-primary", icon: Clock };
  }
}

function formatDateFr(iso: string) {
  if (iso === "—") return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function typeJustificationLabel(type: string) {
  switch (type) {
    case "absence":
      return "Absence";
    case "retard":
      return "Retard";
    case "congé":
      return "Congé";
    default:
      return type;
  }
}

/* ------------------------ Page ------------------------ */

function AlertesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );
  const [query, setQuery] = useState("");
  const [severiteFilter, setSeveriteFilter] = useState<"Tous" | SeveriteAlerte>("Tous");
  const [statutFilter, setStatutFilter] = useState<"Tous" | StatutAlerte>("Tous");

  const kpis = {
    total: ALERTES.length,
    nonLues: ALERTES.filter((a) => a.statut === "non-lue").length,
    critiques: ALERTES.filter((a) => a.severite === "critique").length,
    info: ALERTES.filter((a) => a.severite === "info").length,
  };

  const justificationsEnAttente = JUSTIFICATIONS.filter((j) => j.statut === "en-attente");

  const filteredAlertes = useMemo(() => {
    return ALERTES.filter((a) => {
      if (severiteFilter !== "Tous" && a.severite !== severiteFilter) return false;
      if (statutFilter !== "Tous" && a.statut !== statutFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          a.titre.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.systeme.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [query, severiteFilter, statutFilter]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Alertes" sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-foreground">Alertes Actives</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Suivi centralisé des alertes système et des justifications de présence des stagiaires.
            </p>
          </div>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <KpiCard label="Total alertes" value={String(kpis.total)} iconTone="blue" icon={Bell} />
            <KpiCard label="Non lues" value={String(kpis.nonLues)} iconTone="amber" icon={AlertCircle} />
            <KpiCard label="Critiques" value={String(kpis.critiques)} iconTone="red" icon={AlertTriangle} />
            <KpiCard label="Info" value={String(kpis.info)} iconTone="blue" icon={Info} />
          </div>

          {/* Alertes section */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Header */}
            <div className="px-4 md:px-5 py-3.5 border-b border-border flex items-center gap-2.5">
              <Bell className="h-4 w-4 text-primary shrink-0" />
              <h3 className="text-sm font-semibold text-foreground">Alertes</h3>
              <span className="text-[11px] text-muted-foreground">
                · {filteredAlertes.length} alerte(s)
              </span>
            </div>

            {/* Filters */}
            <div className="px-4 md:px-5 py-3 border-b border-border flex flex-col md:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une alerte, un système, une description…"
                  className="w-full h-9 pl-9 pr-9 rounded-md bg-background border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mr-1">
                  <Filter className="h-3 w-3" /> Filtres :
                </span>
                <div className="flex gap-1">
                  {(["Tous", "critique", "avertissement", "info"] as const).map((s) => {
                    const active = severiteFilter === s;
                    const label = s === "Tous" ? "Tous" : s === "critique" ? "Critiques" : s === "avertissement" ? "Avertissements" : "Info";
                    return (
                      <button
                        key={s}
                        onClick={() => setSeveriteFilter(s as "Tous" | SeveriteAlerte)}
                        className={`h-7 px-2.5 rounded-full text-[11px] font-medium ring-1 ring-inset transition-colors ${
                          active
                            ? "bg-primary/15 text-primary ring-primary/30"
                            : "bg-background text-muted-foreground ring-border hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Alertes List */}
            <div className="space-y-0">
              {filteredAlertes.length === 0 ? (
                <div className="px-4 md:px-5 py-10 text-center text-sm text-muted-foreground">
                  Aucune alerte ne correspond aux filtres.
                </div>
              ) : (
                filteredAlertes.map((alerte, index) => {
                  const m = severiteMeta(alerte.severite);
                  const IconComponent = m.icon;
                  return (
                    <div
                      key={alerte.id}
                      className={`px-4 md:px-5 py-3.5 flex flex-col md:flex-row md:items-start gap-3 md:gap-4 ${
                        index !== filteredAlertes.length - 1 ? "border-b border-border/60" : ""
                      } ${alerte.statut === "non-lue" ? "bg-muted/20" : "hover:bg-muted/10"} transition-colors`}
                    >
                      <div className={`h-9 w-9 rounded-md ${m.bgIcon} ring-1 ring-inset grid place-items-center shrink-0`}>
                        <IconComponent className={`h-4 w-4 ${m.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-foreground">{alerte.titre}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{alerte.systeme}</div>
                          </div>
                          {alerte.statut === "non-lue" && (
                            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed mb-2">
                          {alerte.description}
                        </p>
                        <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatDateFr(alerte.date)}
                          </span>
                          <span className="tabular-nums">{alerte.heure}</span>
                          {alerte.source && (
                            <span className="inline-flex items-center gap-1">
                              <FileText className="h-3 w-3" /> {alerte.source}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          title="Marquer comme résolu"
                          className={`h-7 px-2.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1 ring-1 ring-inset transition-colors ${
                            alerte.statut === "résolue"
                              ? "bg-success/15 text-success ring-success/25"
                              : "bg-background text-muted-foreground ring-border hover:bg-success/15 hover:text-success hover:ring-success/25"
                          }`}
                        >
                          <CheckCircle className="h-3 w-3" /> Résolu
                        </button>
                        <button title="Supprimer" className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/15 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Justifications section */}
          {justificationsEnAttente.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 md:px-5 py-3.5 border-b border-border flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-sm font-semibold text-foreground">Justifications à Traiter</h3>
                <span className="text-[11px] text-muted-foreground">· {justificationsEnAttente.length} en attente</span>
              </div>

              <div className="divide-y divide-border/60">
                {justificationsEnAttente.map((j) => {
                  const m = statutJustificationMeta(j.statut);
                  const StatIcon = m.icon;
                  return (
                    <div key={j.id} className="px-4 md:px-5 py-4 hover:bg-muted/10 transition-colors">
                      <div className="flex items-start gap-3 mb-2">
                        <span className={`h-8 w-8 rounded-full grid place-items-center text-[11px] font-semibold ring-1 ring-inset ${j.couleur}`}>
                          {j.initiale}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <div className="text-sm font-medium text-foreground">{j.stagiaire}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{typeJustificationLabel(j.type)} — {j.motif}</div>
                            </div>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ring-1 ring-inset whitespace-nowrap ${m.chip}`}>
                              <StatIcon className="h-2.5 w-2.5" />
                              En attente
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {formatDateFr(j.date)}
                            </span>
                            {j.piecesJointes && (
                              <span className="inline-flex items-center gap-1">
                                📎 {j.piecesJointes} pièce(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-3 pl-11">
                        <button className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/25 hover:bg-destructive/20 inline-flex items-center gap-1">
                          ✕ Rejeter
                        </button>
                        <button className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-success/15 text-success ring-1 ring-inset ring-success/25 hover:bg-success/20 inline-flex items-center gap-1">
                          ✓ Accepter
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
