import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search, Plus, LayoutGrid, List as ListIcon, Calendar, Filter,
  CheckCircle2, Circle, Clock, AlertTriangle, Flag, FolderKanban,
  MoreHorizontal, ArrowUpDown, X, MessageSquare, Paperclip,
} from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { NewTacheDialog } from "@/components/taches/NewTacheDialog";

export const Route = createFileRoute("/taches")({
  head: () => ({
    meta: [
      { title: "Tâches — Orchid Island RH" },
      { name: "description", content: "Suivi des tâches, projets, priorités et stagiaires assignés chez Orchid Island Real Estate." },
    ],
  }),
  component: TachesPage,
});

/* ------------------------ Types & mock data ------------------------ */

type Statut = "À faire" | "En cours" | "En revue" | "Terminée";
type Priorite = "Haute" | "Moyenne" | "Basse";

type Stagiaire = { id: string; nom: string; initiale: string; couleur: string };
type Tache = {
  id: string;
  titre: string;
  description: string;
  projet: { id: string; nom: string; couleur: string };
  statut: Statut;
  priorite: Priorite;
  echeance: string; // ISO yyyy-mm-dd
  assignes: string[]; // stagiaire ids
  commentaires: number;
  pj: number;
  tags?: string[];
};

const STAGIAIRES: Stagiaire[] = [
  { id: "yb", nom: "Youssef Bennani", initiale: "YB", couleur: "bg-primary/20 text-primary ring-primary/30" },
  { id: "oe", nom: "Oumaima El Idrissi", initiale: "OE", couleur: "bg-success/20 text-success ring-success/30" },
  { id: "mc", nom: "Mehdi Cherkaoui", initiale: "MC", couleur: "bg-[oklch(0.68_0.18_295/0.2)] text-[oklch(0.78_0.16_295)] ring-[oklch(0.68_0.18_295/0.35)]" },
  { id: "af", nom: "Aya Fassi", initiale: "AF", couleur: "bg-success/20 text-success ring-success/30" },
  { id: "hn", nom: "Hamza Naciri", initiale: "HN", couleur: "bg-warning/20 text-warning ring-warning/30" },
  { id: "la", nom: "Lina Amrani", initiale: "LA", couleur: "bg-destructive/20 text-destructive ring-destructive/30" },
  { id: "rb", nom: "Rim Belghazi", initiale: "RB", couleur: "bg-primary/20 text-primary ring-primary/30" },
];

const PROJETS = [
  { id: "p1", nom: "Refonte site Orchid Island", couleur: "bg-primary/15 text-primary ring-primary/25" },
  { id: "p2", nom: "App mobile Pointage QR", couleur: "bg-[oklch(0.68_0.18_295/0.15)] text-[oklch(0.78_0.16_295)] ring-[oklch(0.68_0.18_295/0.3)]" },
  { id: "p3", nom: "Campagne lancement Marina", couleur: "bg-warning/15 text-warning ring-warning/25" },
  { id: "p4", nom: "Onboarding stagiaires été 2026", couleur: "bg-success/15 text-success ring-success/25" },
];

const MOCK: Tache[] = [
  {
    id: "t1",
    titre: "Wireframes page d'accueil",
    description: "Maquettes basse fidélité pour les 3 sections clés du site.",
    projet: PROJETS[0],
    statut: "En cours",
    priorite: "Haute",
    echeance: "2026-06-12",
    assignes: ["yb", "mc"],
    commentaires: 4, pj: 2,
    tags: ["UX", "Design"],
  },
  {
    id: "t2",
    titre: "Intégration scan QR iOS",
    description: "Implémenter le scan via AVFoundation + retour haptique.",
    projet: PROJETS[1],
    statut: "À faire",
    priorite: "Haute",
    echeance: "2026-06-18",
    assignes: ["af", "oe"],
    commentaires: 1, pj: 0,
    tags: ["iOS", "Caméra"],
  },
  {
    id: "t3",
    titre: "Brief créatif réseaux sociaux",
    description: "Ton de voix, palette, formats Instagram et LinkedIn.",
    projet: PROJETS[2],
    statut: "En revue",
    priorite: "Moyenne",
    echeance: "2026-06-09",
    assignes: ["hn"],
    commentaires: 6, pj: 3,
    tags: ["Social", "Brand"],
  },
  {
    id: "t4",
    titre: "Plan de formation S1",
    description: "Programme semaine 1 : outils internes & culture d'entreprise.",
    projet: PROJETS[3],
    statut: "Terminée",
    priorite: "Basse",
    echeance: "2026-05-30",
    assignes: ["rb", "la"],
    commentaires: 2, pj: 1,
  },
  {
    id: "t5",
    titre: "Audit SEO technique",
    description: "Crawl complet, Core Web Vitals et plan d'action priorisé.",
    projet: PROJETS[0],
    statut: "En cours",
    priorite: "Moyenne",
    echeance: "2026-06-22",
    assignes: ["mc", "yb", "oe"],
    commentaires: 3, pj: 5,
    tags: ["SEO"],
  },
  {
    id: "t6",
    titre: "Tests end-to-end pointage",
    description: "Scénarios Playwright pour les 4 flux principaux.",
    projet: PROJETS[1],
    statut: "À faire",
    priorite: "Moyenne",
    echeance: "2026-07-01",
    assignes: ["af"],
    commentaires: 0, pj: 0,
    tags: ["QA"],
  },
  {
    id: "t7",
    titre: "Visuel teaser Marina",
    description: "3 propositions key visual pour campagne pré-lancement.",
    projet: PROJETS[2],
    statut: "À faire",
    priorite: "Haute",
    echeance: "2026-06-08",
    assignes: ["hn", "la"],
    commentaires: 1, pj: 2,
    tags: ["Création"],
  },
  {
    id: "t8",
    titre: "Livret d'accueil PDF",
    description: "Mise en page Figma + export accessible WCAG AA.",
    projet: PROJETS[3],
    statut: "En revue",
    priorite: "Basse",
    echeance: "2026-06-15",
    assignes: ["rb"],
    commentaires: 2, pj: 1,
  },
];

/* ------------------------ Helpers ------------------------ */

const STATUTS: Statut[] = ["À faire", "En cours", "En revue", "Terminée"];

function statutMeta(s: Statut) {
  switch (s) {
    case "À faire":
      return { icon: Circle, color: "text-muted-foreground", chip: "bg-muted/60 text-muted-foreground ring-border", dot: "bg-muted-foreground/60" };
    case "En cours":
      return { icon: Clock, color: "text-primary", chip: "bg-primary/15 text-primary ring-primary/30", dot: "bg-primary" };
    case "En revue":
      return { icon: AlertTriangle, color: "text-warning", chip: "bg-warning/15 text-warning ring-warning/30", dot: "bg-warning" };
    case "Terminée":
      return { icon: CheckCircle2, color: "text-success", chip: "bg-success/15 text-success ring-success/30", dot: "bg-success" };
  }
}

function prioriteMeta(p: Priorite) {
  switch (p) {
    case "Haute": return { chip: "bg-destructive/10 text-destructive ring-destructive/25", bar: "bg-destructive" };
    case "Moyenne": return { chip: "bg-warning/10 text-warning ring-warning/25", bar: "bg-warning" };
    case "Basse": return { chip: "bg-muted/60 text-muted-foreground ring-border", bar: "bg-muted-foreground/40" };
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function daysUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

function getStagiaires(ids: string[]) {
  return ids.map((id) => STAGIAIRES.find((s) => s.id === id)!).filter(Boolean);
}

/* ------------------------ Page ------------------------ */

function TachesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );
  const [query, setQuery] = useState("");
  const [statut, setStatut] = useState<Statut | "Tous">("Tous");
  const [priorite, setPriorite] = useState<Priorite | "Toutes">("Toutes");
  const [projet, setProjet] = useState<string>("tous");
  const [view, setView] = useState<"kanban" | "liste">("kanban");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    return MOCK.filter((t) => {
      if (statut !== "Tous" && t.statut !== statut) return false;
      if (priorite !== "Toutes" && t.priorite !== priorite) return false;
      if (projet !== "tous" && t.projet.id !== projet) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          t.titre.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.projet.nom.toLowerCase().includes(q) ||
          (t.tags ?? []).some((x) => x.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [query, statut, priorite, projet]);

  const kpis = {
    total: MOCK.length,
    enCours: MOCK.filter((t) => t.statut === "En cours").length,
    enRetard: MOCK.filter((t) => t.statut !== "Terminée" && daysUntil(t.echeance) < 0).length,
    terminees: MOCK.filter((t) => t.statut === "Terminée").length,
  };

  const grouped: Record<Statut, Tache[]> = {
    "À faire": [], "En cours": [], "En revue": [], "Terminée": [],
  };
  filtered.forEach((t) => grouped[t.statut].push(t));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Tâches" sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Toutes les tâches</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filtered.length} tâche{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center rounded-md border border-border bg-card p-0.5">
                <button
                  onClick={() => setView("kanban")}
                  className={`h-7 px-2.5 rounded text-xs inline-flex items-center gap-1.5 transition-colors ${view === "kanban" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Kanban
                </button>
                <button
                  onClick={() => setView("liste")}
                  className={`h-7 px-2.5 rounded text-xs inline-flex items-center gap-1.5 transition-colors ${view === "liste" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <ListIcon className="h-3.5 w-3.5" /> Liste
                </button>
              </div>
              <button onClick={() => setCreateOpen(true)} className="h-9 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 shadow-sm transition-colors">
                <Plus className="h-4 w-4" /> Nouvelle tâche
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <KpiCard label="Total" value={String(kpis.total)} iconTone="violet" icon={FolderKanban} />
            <KpiCard label="En cours" value={String(kpis.enCours)} iconTone="blue" icon={Clock} />
            <KpiCard label="En retard" value={String(kpis.enRetard)} iconTone="red" icon={AlertTriangle} />
            <KpiCard label="Terminées" value={String(kpis.terminees)} iconTone="green" icon={CheckCircle2} />
          </div>

          {/* Filters */}
          <div className="rounded-xl border border-border bg-card p-3 md:p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une tâche, un projet, un tag…"
                  className="w-full h-9 pl-9 pr-9 rounded-md bg-background border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <SelectFilter
                  icon={FolderKanban}
                  value={projet}
                  onChange={setProjet}
                  options={[{ value: "tous", label: "Tous les projets" }, ...PROJETS.map((p) => ({ value: p.id, label: p.nom }))]}
                />
                <SelectFilter
                  icon={Flag}
                  value={priorite}
                  onChange={(v) => setPriorite(v as Priorite | "Toutes")}
                  options={[
                    { value: "Toutes", label: "Toutes priorités" },
                    { value: "Haute", label: "Haute" },
                    { value: "Moyenne", label: "Moyenne" },
                    { value: "Basse", label: "Basse" },
                  ]}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mr-1">
                <Filter className="h-3 w-3" /> Statut :
              </span>
              {(["Tous", ...STATUTS] as const).map((s) => {
                const active = statut === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatut(s as Statut | "Tous")}
                    className={`h-7 px-2.5 rounded-full text-[11px] font-medium ring-1 ring-inset transition-colors ${
                      active
                        ? "bg-primary/15 text-primary ring-primary/30"
                        : "bg-background text-muted-foreground ring-border hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
              <p className="text-sm text-foreground">Aucune tâche ne correspond aux filtres.</p>
              <p className="text-xs text-muted-foreground mt-1">Ajustez la recherche ou réinitialisez les filtres.</p>
            </div>
          ) : view === "kanban" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {STATUTS.map((s) => (
                <Column key={s} statut={s} taches={grouped[s]} />
              ))}
            </div>
          ) : (
            <ListView taches={filtered} />
          )}
        </main>
      </div>

      <NewTacheDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projets={PROJETS}
        stagiaires={STAGIAIRES}
      />
    </div>
  );
}

/* ------------------------ Sub-components ------------------------ */

function SelectFilter({
  value, onChange, options, icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon: typeof Filter;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-8 pr-7 rounded-md bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Column({ statut, taches }: { statut: Statut; taches: Tache[] }) {
  const meta = statutMeta(statut);
  const Icon = meta.icon;
  return (
    <div className="rounded-xl border border-border bg-card/60 flex flex-col min-h-[180px]">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
          <h3 className="text-xs font-semibold text-foreground">{statut}</h3>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground tabular-nums">
            {taches.length}
          </span>
        </div>
        <button className="h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-2 space-y-2 flex-1">
        {taches.length === 0 ? (
          <div className="text-[11px] text-muted-foreground/70 text-center py-6">
            Aucune tâche
          </div>
        ) : (
          taches.map((t) => <TacheCard key={t.id} t={t} />)
        )}
      </div>
    </div>
  );
}

function TacheCard({ t }: { t: Tache }) {
  const pm = prioriteMeta(t.priorite);
  const days = daysUntil(t.echeance);
  const isOverdue = days < 0 && t.statut !== "Terminée";
  const isSoon = days >= 0 && days <= 3 && t.statut !== "Terminée";
  const assignes = getStagiaires(t.assignes);

  return (
    <article className="group relative rounded-lg border border-border bg-card hover:border-border/80 hover:shadow-sm transition-all p-3 space-y-2.5">
      {/* Priority bar */}
      <span className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-r ${pm.bar}`} />

      {/* Project tag */}
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1 max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${t.projet.couleur}`}>
          <FolderKanban className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">{t.projet.nom}</span>
        </span>
        <button className="opacity-0 group-hover:opacity-100 h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-opacity">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Title & desc */}
      <div>
        <h4 className="text-sm font-medium text-foreground leading-snug line-clamp-2">{t.titre}</h4>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
      </div>

      {/* Tags */}
      {t.tags && t.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {t.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Priority + due */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${pm.chip}`}>
          <Flag className="h-2.5 w-2.5" />
          {t.priorite}
        </span>
        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
          isOverdue ? "bg-destructive/10 text-destructive ring-destructive/25"
          : isSoon ? "bg-warning/10 text-warning ring-warning/25"
          : "bg-muted/50 text-muted-foreground ring-border"
        }`}>
          <Calendar className="h-2.5 w-2.5" />
          {formatDate(t.echeance)}
          {isOverdue && <span className="ml-0.5">· retard</span>}
          {isSoon && !isOverdue && <span className="ml-0.5">· J-{days}</span>}
        </span>
      </div>

      {/* Footer: assignees + meta */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
        <div className="flex -space-x-1.5">
          {assignes.slice(0, 4).map((s) => (
            <div
              key={s.id}
              title={s.nom}
              className={`h-6 w-6 rounded-full grid place-items-center text-[9px] font-semibold ring-2 ring-card ${s.couleur}`}
            >
              {s.initiale}
            </div>
          ))}
          {assignes.length > 4 && (
            <div className="h-6 w-6 rounded-full grid place-items-center text-[9px] font-semibold bg-muted text-muted-foreground ring-2 ring-card">
              +{assignes.length - 4}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {t.commentaires > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" /> {t.commentaires}
            </span>
          )}
          {t.pj > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Paperclip className="h-3 w-3" /> {t.pj}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function ListView({ taches }: { taches: Tache[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="hidden md:grid grid-cols-[1.6fr_1fr_110px_110px_140px_120px] gap-3 px-4 py-2.5 border-b border-border bg-muted/30 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
        <div className="inline-flex items-center gap-1">Tâche <ArrowUpDown className="h-3 w-3" /></div>
        <div>Projet</div>
        <div>Priorité</div>
        <div>Statut</div>
        <div>Échéance</div>
        <div>Assignés</div>
      </div>
      <ul className="divide-y divide-border">
        {taches.map((t) => {
          const sm = statutMeta(t.statut);
          const pm = prioriteMeta(t.priorite);
          const SIcon = sm.icon;
          const days = daysUntil(t.echeance);
          const isOverdue = days < 0 && t.statut !== "Terminée";
          const assignes = getStagiaires(t.assignes);
          return (
            <li key={t.id} className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_110px_110px_140px_120px] gap-3 px-4 py-3 hover:bg-muted/30 transition-colors items-center">
              <div className="min-w-0">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${pm.bar}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{t.titre}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{t.description}</p>
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <span className={`inline-flex items-center gap-1 max-w-full truncate rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${t.projet.couleur}`}>
                  <FolderKanban className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{t.projet.nom}</span>
                </span>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${pm.chip}`}>
                  <Flag className="h-2.5 w-2.5" /> {t.priorite}
                </span>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${sm.chip}`}>
                  <SIcon className="h-2.5 w-2.5" /> {t.statut}
                </span>
              </div>
              <div className={`text-[11px] tabular-nums ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(t.echeance)}
                  {isOverdue && <span className="text-destructive">· retard</span>}
                </span>
              </div>
              <div className="flex -space-x-1.5">
                {assignes.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    title={s.nom}
                    className={`h-6 w-6 rounded-full grid place-items-center text-[9px] font-semibold ring-2 ring-card ${s.couleur}`}
                  >
                    {s.initiale}
                  </div>
                ))}
                {assignes.length > 4 && (
                  <div className="h-6 w-6 rounded-full grid place-items-center text-[9px] font-semibold bg-muted text-muted-foreground ring-2 ring-card">
                    +{assignes.length - 4}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
