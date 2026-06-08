import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  FileText, FileCheck2, Upload, UserCheck, Search, Filter,
  CheckCircle2, Clock, AlertCircle, FileWarning, Mail,
  MessageCircle, Paperclip, Eye, Download, MoreHorizontal,
  CalendarDays, Send, X, FilePlus2, Bell, ShieldCheck,
} from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";

export const Route = createFileRoute("/rapports")({
  head: () => ({
    meta: [
      { title: "Rapports — Orchid Island RH" },
      { name: "description", content: "Suivi des rapports journaliers et finaux des stagiaires d'Orchid Island Real Estate." },
    ],
  }),
  component: RapportsPage,
});

/* ------------------------ Types & mock data ------------------------ */

type StatutDepot = "Déposé" | "Manquant" | "En retard" | "Validé" | "En attente";
type Tab = "journaliers" | "finaux" | "deposer" | "suivi";

type Stagiaire = { id: string; nom: string; initiale: string; couleur: string; projet: string };

type RapportJournalier = {
  id: string;
  stagiaireId: string;
  date: string;
  statut: StatutDepot;
  fichier?: string;
  heure?: string;
  projet: string;
};

type RapportFinal = {
  id: string;
  stagiaireId: string;
  titre: string;
  date: string;
  statut: "Validé" | "En attente" | "À déposer";
  fichier?: string;
  taille?: string;
  pages?: number;
};

const STAGIAIRES: Stagiaire[] = [
  { id: "yb", nom: "Youssef Bennani",   initiale: "YB", couleur: "bg-primary/20 text-primary ring-primary/30", projet: "Refonte site Orchid Island" },
  { id: "oe", nom: "Oumaima El Idrissi",initiale: "OE", couleur: "bg-success/20 text-success ring-success/30", projet: "App mobile Pointage QR" },
  { id: "mc", nom: "Mehdi Cherkaoui",   initiale: "MC", couleur: "bg-[oklch(0.68_0.18_295/0.2)] text-[oklch(0.78_0.16_295)] ring-[oklch(0.68_0.18_295/0.35)]", projet: "Refonte site Orchid Island" },
  { id: "af", nom: "Aya Fassi",         initiale: "AF", couleur: "bg-success/20 text-success ring-success/30", projet: "App mobile Pointage QR" },
  { id: "hn", nom: "Hamza Naciri",      initiale: "HN", couleur: "bg-warning/20 text-warning ring-warning/30", projet: "Campagne lancement Marina" },
  { id: "la", nom: "Lina Amrani",       initiale: "LA", couleur: "bg-destructive/20 text-destructive ring-destructive/30", projet: "Campagne lancement Marina" },
  { id: "rb", nom: "Rim Belghazi",      initiale: "RB", couleur: "bg-primary/20 text-primary ring-primary/30", projet: "Onboarding stagiaires été 2026" },
];

const TODAY = "2026-06-08";

const JOURNALIERS: RapportJournalier[] = [
  { id: "j1", stagiaireId: "yb", date: TODAY, statut: "Déposé",   fichier: "rapport-yb-08-06.pdf", heure: "17:42", projet: "Refonte site Orchid Island" },
  { id: "j2", stagiaireId: "oe", date: TODAY, statut: "Déposé",   fichier: "rapport-oe-08-06.pdf", heure: "16:58", projet: "App mobile Pointage QR" },
  { id: "j3", stagiaireId: "mc", date: TODAY, statut: "En retard",fichier: "rapport-mc-08-06.pdf", heure: "19:12", projet: "Refonte site Orchid Island" },
  { id: "j4", stagiaireId: "af", date: TODAY, statut: "Déposé",   fichier: "rapport-af-08-06.pdf", heure: "17:05", projet: "App mobile Pointage QR" },
  { id: "j5", stagiaireId: "hn", date: TODAY, statut: "Manquant", projet: "Campagne lancement Marina" },
  { id: "j6", stagiaireId: "la", date: TODAY, statut: "Manquant", projet: "Campagne lancement Marina" },
  { id: "j7", stagiaireId: "rb", date: TODAY, statut: "Déposé",   fichier: "rapport-rb-08-06.pdf", heure: "17:30", projet: "Onboarding stagiaires été 2026" },
];

const FINAUX: RapportFinal[] = [
  { id: "f1", stagiaireId: "yb", titre: "Refonte UX — Bilan de stage", date: "2026-06-04", statut: "Validé",     fichier: "memoire-yb-final.pdf", taille: "4.2 Mo", pages: 62 },
  { id: "f2", stagiaireId: "oe", titre: "Application Pointage QR",     date: "2026-06-06", statut: "En attente", fichier: "memoire-oe-final.pdf", taille: "5.8 Mo", pages: 78 },
  { id: "f3", stagiaireId: "mc", titre: "Audit SEO & Performance",     date: "2026-06-07", statut: "En attente", fichier: "memoire-mc-final.pdf", taille: "3.1 Mo", pages: 48 },
  { id: "f4", stagiaireId: "af", titre: "Tests E2E & Qualité",         date: "—",          statut: "À déposer" },
  { id: "f5", stagiaireId: "hn", titre: "Brand book Marina",           date: "—",          statut: "À déposer" },
];

/* ------------------------ Helpers ------------------------ */

function getStagiaire(id: string) {
  return STAGIAIRES.find((s) => s.id === id)!;
}

function statutMeta(s: StatutDepot | RapportFinal["statut"]) {
  switch (s) {
    case "Déposé":
    case "Validé":
      return { chip: "bg-success/15 text-success ring-success/30", dot: "bg-success", icon: CheckCircle2 };
    case "En retard":
      return { chip: "bg-warning/15 text-warning ring-warning/30", dot: "bg-warning", icon: Clock };
    case "Manquant":
    case "À déposer":
      return { chip: "bg-destructive/15 text-destructive ring-destructive/30", dot: "bg-destructive", icon: AlertCircle };
    case "En attente":
      return { chip: "bg-primary/15 text-primary ring-primary/30", dot: "bg-primary", icon: Clock };
    default:
      return { chip: "bg-muted/60 text-muted-foreground ring-border", dot: "bg-muted-foreground/60", icon: AlertCircle };
  }
}

function formatDateFr(iso: string) {
  if (iso === "—") return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ------------------------ Page ------------------------ */

function RapportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );
  const [tab, setTab] = useState<Tab>("journaliers");
  const [query, setQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<"Tous" | StatutDepot>("Tous");
  const [depotOpen, setDepotOpen] = useState(false);

  const kpis = {
    deposes: JOURNALIERS.filter((j) => j.statut === "Déposé" || j.statut === "En retard").length,
    manquants: JOURNALIERS.filter((j) => j.statut === "Manquant").length,
    finauxDeposes: FINAUX.filter((f) => f.statut !== "À déposer").length,
    finauxValides: FINAUX.filter((f) => f.statut === "Validé").length,
    enAttente: FINAUX.filter((f) => f.statut === "En attente").length,
  };

  const filteredJournaliers = useMemo(() => {
    return JOURNALIERS.filter((j) => {
      if (statutFilter !== "Tous" && j.statut !== statutFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const s = getStagiaire(j.stagiaireId);
        return (
          s.nom.toLowerCase().includes(q) ||
          j.projet.toLowerCase().includes(q) ||
          (j.fichier ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [query, statutFilter]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Rapports" sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Centre de rapports</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilotez les rapports journaliers, les mémoires de fin de stage et les notifications associées.
              </p>
            </div>
            <button
              onClick={() => { setTab("deposer"); setDepotOpen(true); }}
              className="h-9 px-3 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Upload className="h-4 w-4" /> Déposer Rapport Final
            </button>
          </div>

          {/* Notification banners */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <div className="rounded-xl border border-success/25 bg-success/[0.06] p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-md bg-success/15 ring-1 ring-inset ring-success/25 grid place-items-center shrink-0">
                <MessageCircle className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">Rappel automatique WhatsApp activé à 17h00</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Les stagiaires n'ayant pas déposé leur rapport reçoivent un message automatique chaque soir.
                </p>
              </div>
              <button className="text-[11px] font-medium text-success hover:text-success/80 inline-flex items-center gap-1 shrink-0">
                <Bell className="h-3 w-3" /> Configurer
              </button>
            </div>

            <div className="rounded-xl border border-primary/25 bg-primary/[0.06] p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-md bg-primary/15 ring-1 ring-inset ring-primary/25 grid place-items-center shrink-0">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-primary">Alerte Email Admin activée</div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground">md@orchidisland.immo</span> reçoit un email à chaque dépôt de rapport.
                </p>
              </div>
              <button className="h-8 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 shrink-0">
                <Send className="h-3.5 w-3.5" /> Envoyer résumé
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-xl border border-border bg-card p-1 flex flex-wrap gap-1">
            <TabButton active={tab === "journaliers"} onClick={() => setTab("journaliers")} icon={FileText} label="Rapports Journaliers" />
            <TabButton active={tab === "finaux"}      onClick={() => setTab("finaux")}      icon={FileCheck2} label="Rapports Finaux de Stage" />
            <TabButton active={tab === "deposer"}     onClick={() => setTab("deposer")}     icon={Paperclip} label="Déposer un Rapport" />
            <TabButton active={tab === "suivi"}       onClick={() => setTab("suivi")}       icon={UserCheck} label="Suivi par Stagiaire" />
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
            <KpiCard label="Rapports déposés aujourd'hui" value={String(kpis.deposes)} iconTone="green" icon={CheckCircle2} />
            <KpiCard label="Rapports manquants"          value={String(kpis.manquants)} iconTone="red"   icon={FileWarning} />
            <KpiCard label="Rapports finaux déposés"     value={String(kpis.finauxDeposes)} iconTone="blue" icon={FileCheck2} />
            <KpiCard label="Rapports finaux validés"     value={String(kpis.finauxValides)} iconTone="green" icon={ShieldCheck} />
            <KpiCard label="En attente de validation"    value={String(kpis.enAttente)} iconTone="amber" icon={Clock} />
          </div>

          {/* Tab content */}
          {tab === "journaliers" && (
            <JournaliersTab
              rows={filteredJournaliers}
              total={JOURNALIERS.length}
              query={query} onQuery={setQuery}
              statut={statutFilter} onStatut={setStatutFilter}
            />
          )}
          {tab === "finaux" && <FinauxTab rows={FINAUX} />}
          {tab === "deposer" && <DeposerTab open={depotOpen} onClose={() => setDepotOpen(false)} />}
          {tab === "suivi" && <SuiviTab />}
        </main>
      </div>
    </div>
  );
}

/* ------------------------ Tab: Journaliers ------------------------ */

function JournaliersTab({
  rows, total, query, onQuery, statut, onStatut,
}: {
  rows: RapportJournalier[];
  total: number;
  query: string;
  onQuery: (v: string) => void;
  statut: "Tous" | StatutDepot;
  onStatut: (v: "Tous" | StatutDepot) => void;
}) {
  const deposes = rows.filter((r) => r.statut === "Déposé" || r.statut === "En retard").length;
  const manquants = rows.filter((r) => r.statut === "Manquant").length;

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Section header */}
      <div className="px-4 md:px-5 py-3.5 border-b border-border flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="h-4 w-4 text-primary shrink-0" />
          <h3 className="text-sm font-semibold text-foreground truncate">
            Rapports Journaliers — Aujourd'hui {formatDateFr(TODAY)}
          </h3>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            · {deposes} déposés · {manquants} manquants
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-3 rounded-md text-xs font-medium bg-success/15 text-success ring-1 ring-inset ring-success/25 hover:bg-success/20 inline-flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </button>
          <button className="h-8 px-3 rounded-md text-xs font-medium bg-primary/15 text-primary ring-1 ring-inset ring-primary/25 hover:bg-primary/20 inline-flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> Email Admin
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="px-4 md:px-5 py-3 border-b border-border flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Rechercher un stagiaire, un projet, un fichier…"
            className="w-full h-9 pl-9 pr-9 rounded-md bg-background border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {query && (
            <button onClick={() => onQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mr-1">
            <Filter className="h-3 w-3" /> Statut :
          </span>
          {(["Tous", "Déposé", "En retard", "Manquant"] as const).map((s) => {
            const active = statut === s;
            return (
              <button
                key={s}
                onClick={() => onStatut(s as "Tous" | StatutDepot)}
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium px-4 md:px-5 py-2.5">Stagiaire</th>
              <th className="text-left font-medium px-3 py-2.5">Date</th>
              <th className="text-left font-medium px-3 py-2.5">Statut dépôt</th>
              <th className="text-left font-medium px-3 py-2.5">Fichier</th>
              <th className="text-left font-medium px-3 py-2.5">Projet</th>
              <th className="text-left font-medium px-3 py-2.5">Heure dépôt</th>
              <th className="text-right font-medium px-4 md:px-5 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Aucun rapport journalier ne correspond aux filtres.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const s = getStagiaire(r.stagiaireId);
                const m = statutMeta(r.statut);
                const StatIcon = m.icon;
                return (
                  <tr key={r.id} className="border-t border-border/60 hover:bg-muted/20 transition-colors">
                    <td className="px-4 md:px-5 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`h-8 w-8 rounded-full grid place-items-center text-[11px] font-semibold ring-1 ring-inset ${s.couleur}`}>
                          {s.initiale}
                        </span>
                        <span className="text-sm text-foreground truncate">{s.nom}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" /> {formatDateFr(r.date)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full ring-1 ring-inset ${m.chip}`}>
                        <StatIcon className="h-3 w-3" />
                        {r.statut}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {r.fichier ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-foreground/90">
                          <Paperclip className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate max-w-[180px]">{r.fichier}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/70 italic">Non déposé</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-muted-foreground truncate inline-block max-w-[180px]">{r.projet}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs tabular-nums text-foreground/80">{r.heure ?? "—"}</span>
                    </td>
                    <td className="px-4 md:px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {r.fichier ? (
                          <>
                            <IconBtn title="Voir" icon={Eye} />
                            <IconBtn title="Télécharger" icon={Download} />
                          </>
                        ) : (
                          <button className="h-7 px-2 rounded-md text-[11px] font-medium bg-warning/15 text-warning ring-1 ring-inset ring-warning/25 hover:bg-warning/20 inline-flex items-center gap-1">
                            <Bell className="h-3 w-3" /> Relancer
                          </button>
                        )}
                        <IconBtn title="Plus" icon={MoreHorizontal} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 md:px-5 py-2.5 border-t border-border bg-muted/20 text-[11px] text-muted-foreground">
        {rows.length} / {total} rapports affichés
      </div>
    </section>
  );
}

/* ------------------------ Tab: Finaux ------------------------ */

function FinauxTab({ rows }: { rows: RapportFinal[] }) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 md:px-5 py-3.5 border-b border-border flex items-center gap-2.5">
        <FileCheck2 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Rapports finaux de stage</h3>
        <span className="text-[11px] text-muted-foreground">· {rows.length} rapports</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 p-4 md:p-5">
        {rows.map((f) => {
          const s = getStagiaire(f.stagiaireId);
          const m = statutMeta(f.statut);
          const StatIcon = m.icon;
          return (
            <article key={f.id} className="rounded-lg border border-border bg-background/50 hover:border-border/80 hover:shadow-sm transition-all p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`h-9 w-9 rounded-full grid place-items-center text-[11px] font-semibold ring-1 ring-inset ${s.couleur}`}>
                    {s.initiale}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{s.nom}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{s.projet}</div>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ring-1 ring-inset whitespace-nowrap ${m.chip}`}>
                  <StatIcon className="h-2.5 w-2.5" />
                  {f.statut}
                </span>
              </div>

              <div>
                <div className="text-sm text-foreground/90 leading-snug line-clamp-2">{f.titre}</div>
                {f.fichier ? (
                  <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Paperclip className="h-3 w-3" />
                    <span className="truncate">{f.fichier}</span>
                    {f.taille && <span>· {f.taille}</span>}
                    {f.pages && <span>· {f.pages} pages</span>}
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-muted-foreground/70 italic">Aucun fichier déposé</div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarDays className="h-3 w-3" /> {formatDateFr(f.date)}
                </span>
                <div className="flex items-center gap-1">
                  {f.fichier ? (
                    <>
                      <IconBtn title="Aperçu" icon={Eye} />
                      <IconBtn title="Télécharger" icon={Download} />
                      {f.statut === "En attente" && (
                        <button className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-success/15 text-success ring-1 ring-inset ring-success/25 hover:bg-success/20 inline-flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Valider
                        </button>
                      )}
                    </>
                  ) : (
                    <button className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-warning/15 text-warning ring-1 ring-inset ring-warning/25 hover:bg-warning/20 inline-flex items-center gap-1">
                      <Bell className="h-3 w-3" /> Relancer
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------ Tab: Déposer ------------------------ */

function DeposerTab({ open: _open, onClose: _onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState<"journalier" | "final">("journalier");
  const [stagiaire, setStagiaire] = useState(STAGIAIRES[0].id);
  const [note, setNote] = useState("");

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 md:px-5 py-3.5 border-b border-border flex items-center gap-2.5">
        <Paperclip className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Déposer un rapport</h3>
      </div>

      <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {/* Form */}
        <div className="space-y-4">
          <Field label="Type de rapport">
            <div className="grid grid-cols-2 gap-2">
              {(["journalier", "final"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`h-9 rounded-md text-xs font-medium ring-1 ring-inset transition-colors ${
                    type === t
                      ? "bg-primary/15 text-primary ring-primary/30"
                      : "bg-background text-muted-foreground ring-border hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {t === "journalier" ? "Rapport journalier" : "Rapport final de stage"}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Stagiaire">
            <select
              value={stagiaire}
              onChange={(e) => setStagiaire(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {STAGIAIRES.map((s) => (
                <option key={s.id} value={s.id}>{s.nom} — {s.projet}</option>
              ))}
            </select>
          </Field>

          <Field label="Date">
            <input
              type="date"
              defaultValue={TODAY}
              className="w-full h-9 px-3 rounded-md bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </Field>

          <Field label="Note (optionnel)">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Résumé du rapport, points clés…"
              className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </Field>
        </div>

        {/* Dropzone */}
        <div className="space-y-4">
          <Field label="Fichier (PDF, DOCX — max 20 Mo)">
            <label className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-border bg-background/40 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer">
              <div className="h-11 w-11 rounded-full bg-primary/15 ring-1 ring-inset ring-primary/25 grid place-items-center mb-2">
                <FilePlus2 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-sm font-medium text-foreground">Glissez votre fichier ici</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">ou cliquez pour parcourir</div>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" />
            </label>
          </Field>

          <div className="rounded-lg border border-border bg-background/40 p-3 text-[11px] text-muted-foreground leading-relaxed">
            <p className="text-foreground/80 font-medium mb-1 inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-success" /> Notifications automatiques
            </p>
            Un email sera envoyé à <span className="text-foreground">md@orchidisland.immo</span> et un message WhatsApp confirmera le dépôt au stagiaire concerné.
          </div>

          <div className="flex items-center justify-end gap-2">
            <button className="h-9 px-3 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40">
              Annuler
            </button>
            <button className="h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5">
              <Upload className="h-4 w-4" /> Déposer
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------ Tab: Suivi ------------------------ */

function SuiviTab() {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 md:px-5 py-3.5 border-b border-border flex items-center gap-2.5">
        <UserCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Suivi par stagiaire</h3>
        <span className="text-[11px] text-muted-foreground">· {STAGIAIRES.length} stagiaires</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium px-4 md:px-5 py-2.5">Stagiaire</th>
              <th className="text-left font-medium px-3 py-2.5">Projet</th>
              <th className="text-left font-medium px-3 py-2.5">Journaliers</th>
              <th className="text-left font-medium px-3 py-2.5">Taux de dépôt</th>
              <th className="text-left font-medium px-3 py-2.5">Rapport final</th>
              <th className="text-right font-medium px-4 md:px-5 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {STAGIAIRES.map((s) => {
              const deposes = JOURNALIERS.filter((j) => j.stagiaireId === s.id && j.statut !== "Manquant").length;
              const total = JOURNALIERS.filter((j) => j.stagiaireId === s.id).length || 1;
              const pct = Math.round((deposes / total) * 100);
              const final = FINAUX.find((f) => f.stagiaireId === s.id);
              const fm = final ? statutMeta(final.statut) : null;
              const FIcon = fm?.icon;
              return (
                <tr key={s.id} className="border-t border-border/60 hover:bg-muted/20 transition-colors">
                  <td className="px-4 md:px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-8 w-8 rounded-full grid place-items-center text-[11px] font-semibold ring-1 ring-inset ${s.couleur}`}>
                        {s.initiale}
                      </span>
                      <span className="text-sm text-foreground">{s.nom}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{s.projet}</td>
                  <td className="px-3 py-3">
                    <span className="text-xs tabular-nums text-foreground/90">{deposes}/{total}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className={`h-full ${pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-destructive"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] tabular-nums text-muted-foreground w-9 text-right">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {final && fm && FIcon ? (
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full ring-1 ring-inset ${fm.chip}`}>
                        <FIcon className="h-3 w-3" />
                        {final.statut}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/70 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 md:px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn title="Voir profil" icon={Eye} />
                      <IconBtn title="Relancer" icon={Bell} />
                      <IconBtn title="Plus" icon={MoreHorizontal} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ------------------------ Small UI helpers ------------------------ */

function TabButton({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void; icon: typeof FileText; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 min-w-[160px] h-9 px-3 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-2 transition-colors ${
        active
          ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/30"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function IconBtn({ icon: Icon, title }: { icon: typeof Eye; title: string }) {
  return (
    <button
      title={title}
      className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
