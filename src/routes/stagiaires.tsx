import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search, SlidersHorizontal, Plus, Eye, Pencil, RotateCcw, Trash2,
  Users, UserCheck, UserPlus, Clock, X, ChevronLeft, ChevronRight,
} from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";

export const Route = createFileRoute("/stagiaires")({
  head: () => ({
    meta: [
      { title: "Stagiaires — Orchid Island RH" },
      { name: "description", content: "Gestion des stagiaires Orchid Island Real Estate." },
    ],
  }),
  component: StagiairesPage,
});

type Statut = "Accepté" | "En attente" | "Refusé" | "Terminé";
type Stagiaire = {
  id: string;
  nom: string;
  email: string;
  ecole: string;
  formation: string;
  departement: string;
  statut: Statut;
  absences: number;
  absencesMax: number;
  stageDebut: string;
  stageFin: string;
  rapport: "Déposé" | "Non déposé" | "En relecture";
  initiale: string;
  couleur: string;
};

const MOCK: Stagiaire[] = [
  { id: "1", nom: "Yasmine Bennani", email: "y.bennani@orchidisland.immo", ecole: "ENCG Casablanca", formation: "Marketing Digital", departement: "Marketing", statut: "Accepté", absences: 0, absencesMax: 3, stageDebut: "01/05/2026", stageFin: "30/07/2026", rapport: "Non déposé", initiale: "YB", couleur: "bg-primary/20 text-primary" },
  { id: "2", nom: "Omar El Idrissi", email: "o.elidrissi@orchidisland.immo", ecole: "EMI Rabat", formation: "Génie Logiciel", departement: "IT", statut: "Accepté", absences: 1, absencesMax: 3, stageDebut: "15/04/2026", stageFin: "15/08/2026", rapport: "En relecture", initiale: "OE", couleur: "bg-success/20 text-success" },
  { id: "3", nom: "Salma Tazi", email: "s.tazi@orchidisland.immo", ecole: "ISCAE", formation: "Finance", departement: "Comptabilité", statut: "En attente", absences: 0, absencesMax: 3, stageDebut: "—", stageFin: "—", rapport: "Non déposé", initiale: "ST", couleur: "bg-warning/20 text-warning" },
  { id: "4", nom: "Mehdi Cherkaoui", email: "m.cherkaoui@orchidisland.immo", ecole: "ENSA Marrakech", formation: "Architecture", departement: "Projets", statut: "Accepté", absences: 2, absencesMax: 3, stageDebut: "01/03/2026", stageFin: "31/05/2026", rapport: "Déposé", initiale: "MC", couleur: "bg-[oklch(0.68_0.18_295/0.2)] text-[oklch(0.78_0.16_295)]" },
  { id: "5", nom: "Lina Amrani", email: "l.amrani@orchidisland.immo", ecole: "Sup de Co", formation: "Commerce International", departement: "Ventes", statut: "Refusé", absences: 0, absencesMax: 3, stageDebut: "—", stageFin: "—", rapport: "Non déposé", initiale: "LA", couleur: "bg-destructive/20 text-destructive" },
  { id: "6", nom: "Rayan Berrada", email: "r.berrada@orchidisland.immo", ecole: "ENCG Settat", formation: "RH", departement: "RH", statut: "Accepté", absences: 0, absencesMax: 3, stageDebut: "01/06/2026", stageFin: "31/08/2026", rapport: "Non déposé", initiale: "RB", couleur: "bg-primary/20 text-primary" },
  { id: "7", nom: "Hiba Naciri", email: "h.naciri@orchidisland.immo", ecole: "Al Akhawayn", formation: "Communication", departement: "Marketing", statut: "Terminé", absences: 1, absencesMax: 3, stageDebut: "01/01/2026", stageFin: "31/03/2026", rapport: "Déposé", initiale: "HN", couleur: "bg-muted text-muted-foreground" },
  { id: "8", nom: "Adam Fassi", email: "a.fassi@orchidisland.immo", ecole: "ENSAM", formation: "Data Science", departement: "IT", statut: "Accepté", absences: 0, absencesMax: 3, stageDebut: "15/05/2026", stageFin: "15/09/2026", rapport: "Non déposé", initiale: "AF", couleur: "bg-success/20 text-success" },
];

const STATUTS: Statut[] = ["Accepté", "En attente", "Refusé", "Terminé"];
const ECOLES = ["ENCG Casablanca", "EMI Rabat", "ISCAE", "ENSA Marrakech", "Sup de Co", "ENCG Settat", "Al Akhawayn", "ENSAM"];
const DEPARTEMENTS = ["Marketing", "IT", "Comptabilité", "Projets", "Ventes", "RH"];

function statutBadge(s: Statut) {
  const map: Record<Statut, string> = {
    "Accepté": "bg-success/15 text-success ring-success/25",
    "En attente": "bg-warning/15 text-warning ring-warning/25",
    "Refusé": "bg-destructive/15 text-destructive ring-destructive/25",
    "Terminé": "bg-muted text-muted-foreground ring-border",
  };
  return map[s];
}

function StagiairesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );

  const [q, setQ] = useState("");
  const [statut, setStatut] = useState<Statut | "all">("all");
  const [ecole, setEcole] = useState<string>("all");
  const [departement, setDepartement] = useState<string>("all");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return MOCK.filter((s) => {
      if (statut !== "all" && s.statut !== statut) return false;
      if (ecole !== "all" && s.ecole !== ecole) return false;
      if (departement !== "all" && s.departement !== departement) return false;
      if (!needle) return true;
      return (
        s.nom.toLowerCase().includes(needle) ||
        s.email.toLowerCase().includes(needle) ||
        s.ecole.toLowerCase().includes(needle) ||
        s.formation.toLowerCase().includes(needle) ||
        s.departement.toLowerCase().includes(needle)
      );
    });
  }, [q, statut, ecole, departement]);

  const activeFiltersCount = [statut, ecole, departement].filter((v) => v !== "all").length;

  const kpis = useMemo(() => {
    const total = MOCK.length;
    const actifs = MOCK.filter((s) => s.statut === "Accepté").length;
    const enAttente = MOCK.filter((s) => s.statut === "En attente").length;
    const nouveaux = MOCK.filter((s) => s.stageDebut.includes("/05/2026") || s.stageDebut.includes("/06/2026")).length;
    return { total, actifs, enAttente, nouveaux };
  }, []);

  function resetFilters() {
    setQ(""); setStatut("all"); setEcole("all"); setDepartement("all");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Stagiaires" sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Gestion des stagiaires</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filtered.length} sur {MOCK.length} stagiaires
              </p>
            </div>
            <button className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              Nouveau stagiaire
            </button>
          </div>

          {/* KPIs */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Total" value={kpis.total} icon={Users} iconTone="blue" />
            <KpiCard label="Actifs" value={kpis.actifs} icon={UserCheck} iconTone="green" />
            <KpiCard label="En attente" value={kpis.enAttente} icon={Clock} iconTone="amber" />
            <KpiCard label="Nouveaux ce trimestre" value={kpis.nouveaux} icon={UserPlus} iconTone="violet" />
          </section>

          {/* Search + filters */}
          <section className="rounded-xl border border-border bg-card p-3 md:p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher par nom, email, école, formation, département…"
                  className="w-full h-10 pl-9 pr-9 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors"
                />
                {q && (
                  <button
                    onClick={() => setQ("")}
                    aria-label="Effacer"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setAdvancedOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 h-10 px-3 rounded-md border text-sm transition-colors ${
                  advancedOpen || activeFiltersCount > 0
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-background border-border text-foreground hover:bg-muted/60"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="ml-0.5 h-4 min-w-4 px-1 grid place-items-center text-[10px] rounded-full bg-primary text-primary-foreground font-medium">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              {(q || activeFiltersCount > 0) && (
                <button
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 h-10 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {advancedOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
                <FilterSelect label="Statut" value={statut} onChange={(v) => setStatut(v as Statut | "all")}
                  options={[{ value: "all", label: "Tous les statuts" }, ...STATUTS.map((s) => ({ value: s, label: s }))]} />
                <FilterSelect label="École" value={ecole} onChange={setEcole}
                  options={[{ value: "all", label: "Toutes les écoles" }, ...ECOLES.map((e) => ({ value: e, label: e }))]} />
                <FilterSelect label="Département" value={departement} onChange={setDepartement}
                  options={[{ value: "all", label: "Tous les départements" }, ...DEPARTEMENTS.map((d) => ({ value: d, label: d }))]} />
              </div>
            )}
          </section>

          {/* Table */}
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 md:px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Liste des stagiaires</h3>
              <span className="text-xs text-muted-foreground tabular-nums">{filtered.length} résultats</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                    <th className="text-left font-medium px-4 md:px-5 py-2.5">Stagiaire</th>
                    <th className="text-left font-medium px-3 py-2.5">École / Formation</th>
                    <th className="text-left font-medium px-3 py-2.5">Département</th>
                    <th className="text-left font-medium px-3 py-2.5">Statut</th>
                    <th className="text-left font-medium px-3 py-2.5">Absences</th>
                    <th className="text-left font-medium px-3 py-2.5">Stage</th>
                    <th className="text-left font-medium px-3 py-2.5">Rapport</th>
                    <th className="text-right font-medium px-4 md:px-5 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 md:px-5 py-3">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className={`h-9 w-9 rounded-full grid place-items-center text-xs font-semibold ${s.couleur}`}>
                            {s.initiale}
                          </div>
                          <div className="leading-tight">
                            <div className="text-sm font-medium text-foreground">{s.nom}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="leading-tight">
                          <div className="text-sm text-foreground">{s.ecole}</div>
                          <div className="text-xs text-muted-foreground">{s.formation}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-foreground">{s.departement}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${statutBadge(s.statut)}`}>
                          {s.statut}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs tabular-nums ${
                          s.absences === 0 ? "text-muted-foreground" :
                          s.absences >= s.absencesMax ? "text-destructive" : "text-warning"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            s.absences === 0 ? "bg-success" :
                            s.absences >= s.absencesMax ? "bg-destructive" : "bg-warning"
                          }`} />
                          {s.absences}/{s.absencesMax}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs text-muted-foreground tabular-nums leading-tight">
                          {s.stageDebut === "—" ? <span>—</span> : (
                            <>
                              <div>{s.stageDebut}</div>
                              <div className="text-muted-foreground/60">→ {s.stageFin}</div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs ${
                          s.rapport === "Déposé" ? "text-success" :
                          s.rapport === "En relecture" ? "text-warning" :
                          "text-muted-foreground"
                        }`}>
                          {s.rapport}
                        </span>
                      </td>
                      <td className="px-4 md:px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <ActionBtn icon={Eye} label="Voir" tone="blue" />
                          <ActionBtn icon={Pencil} label="Modifier" tone="amber" />
                          <ActionBtn icon={RotateCcw} label="Réinitialiser mot de passe" tone="violet" />
                          <ActionBtn icon={Trash2} label="Supprimer" tone="danger" />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        Aucun stagiaire ne correspond à votre recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 md:px-5 py-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Affichage 1–{filtered.length} sur {MOCK.length}
              </span>
              <div className="flex items-center gap-1">
                <PageBtn><ChevronLeft className="h-3.5 w-3.5" /></PageBtn>
                <PageBtn active>1</PageBtn>
                <PageBtn>2</PageBtn>
                <PageBtn>3</PageBtn>
                <PageBtn><ChevronRight className="h-3.5 w-3.5" /></PageBtn>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-9 px-2.5 rounded-md bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function ActionBtn({
  icon: Icon, label, tone = "default",
}: {
  icon: typeof Eye;
  label: string;
  tone?: "default" | "blue" | "amber" | "violet" | "danger";
}) {
  const cls: Record<typeof tone, string> = {
    default: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
    blue: "text-[oklch(0.68_0.14_250)] hover:text-[oklch(0.60_0.16_250)] hover:bg-[oklch(0.68_0.14_250/0.12)]",
    amber: "text-[oklch(0.72_0.15_80)] hover:text-[oklch(0.65_0.18_80)] hover:bg-[oklch(0.72_0.15_80/0.12)]",
    violet: "text-[oklch(0.68_0.18_295)] hover:text-[oklch(0.60_0.20_295)] hover:bg-[oklch(0.68_0.18_295/0.12)]",
    danger: "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
  };
  return (
    <button
      title={label}
      aria-label={label}
      className={`group/btn h-8 w-8 grid place-items-center rounded-md transition-colors ${cls[tone]}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function PageBtn({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`h-7 min-w-7 px-2 grid place-items-center rounded-md text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      }`}
    >
      {children}
    </button>
  );
}
