import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  QrCode, Users, LogIn, LogOut, Clock, Search,
  CheckCircle2, AlertTriangle, XCircle, Calendar, TrendingUp, Filter,
  Printer, Copy, Eye,
} from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";

export const Route = createFileRoute("/pointage")({
  head: () => ({
    meta: [
      { title: "Pointage QR — Orchid Island RH" },
      { name: "description", content: "Suivi des présences via QR code des stagiaires Orchid Island." },
    ],
  }),
  component: PointagePage,
});

type Statut = "Présent" | "Sorti" | "En pause" | "Absent" | "Retard";

type Pointage = {
  id: string;
  nom: string;
  initiale: string;
  couleur: string;
  departement: string;
  entree: string | null;
  sortie: string | null;
  duree: string;
  statut: Statut;
  retard?: number; // minutes
};

const POINTAGES: Pointage[] = [
  { id: "1", nom: "Yasmine Bennani", initiale: "YB", couleur: "bg-primary/20 text-primary", departement: "Marketing", entree: "08:52", sortie: null, duree: "4h 12m", statut: "Présent" },
  { id: "2", nom: "Omar El Idrissi", initiale: "OE", couleur: "bg-success/20 text-success", departement: "IT", entree: "09:05", sortie: null, duree: "3h 59m", statut: "En pause" },
  { id: "3", nom: "Mehdi Cherkaoui", initiale: "MC", couleur: "bg-[oklch(0.68_0.18_295/0.2)] text-[oklch(0.78_0.16_295)]", departement: "Projets", entree: "09:32", sortie: null, duree: "3h 32m", statut: "Retard", retard: 32 },
  { id: "4", nom: "Rayan Berrada", initiale: "RB", couleur: "bg-primary/20 text-primary", departement: "RH", entree: "08:45", sortie: "13:02", duree: "4h 17m", statut: "Sorti" },
  { id: "5", nom: "Adam Fassi", initiale: "AF", couleur: "bg-success/20 text-success", departement: "IT", entree: "08:58", sortie: null, duree: "4h 06m", statut: "Présent" },
  { id: "6", nom: "Salma Tazi", initiale: "ST", couleur: "bg-warning/20 text-warning", departement: "Comptabilité", entree: null, sortie: null, duree: "—", statut: "Absent" },
];

type Event = { id: string; nom: string; initiale: string; couleur: string; type: "Entrée" | "Sortie"; heure: string; departement: string };
const EVENTS: Event[] = [
  { id: "e1", nom: "Rayan Berrada", initiale: "RB", couleur: "bg-primary/20 text-primary", type: "Sortie", heure: "13:02", departement: "RH" },
  { id: "e2", nom: "Omar El Idrissi", initiale: "OE", couleur: "bg-success/20 text-success", type: "Sortie", heure: "12:45", departement: "IT" },
  { id: "e3", nom: "Mehdi Cherkaoui", initiale: "MC", couleur: "bg-[oklch(0.68_0.18_295/0.2)] text-[oklch(0.78_0.16_295)]", type: "Entrée", heure: "09:32", departement: "Projets" },
  { id: "e4", nom: "Omar El Idrissi", initiale: "OE", couleur: "bg-success/20 text-success", type: "Entrée", heure: "09:05", departement: "IT" },
  { id: "e5", nom: "Adam Fassi", initiale: "AF", couleur: "bg-success/20 text-success", type: "Entrée", heure: "08:58", departement: "IT" },
  { id: "e6", nom: "Yasmine Bennani", initiale: "YB", couleur: "bg-primary/20 text-primary", type: "Entrée", heure: "08:52", departement: "Marketing" },
  { id: "e7", nom: "Rayan Berrada", initiale: "RB", couleur: "bg-primary/20 text-primary", type: "Entrée", heure: "08:45", departement: "RH" },
];

function statutBadge(s: Statut) {
  const m: Record<Statut, string> = {
    "Présent": "bg-success/15 text-success ring-success/25",
    "En pause": "bg-warning/15 text-warning ring-warning/25",
    "Sorti": "bg-muted/60 text-muted-foreground ring-border",
    "Absent": "bg-destructive/15 text-destructive ring-destructive/25",
    "Retard": "bg-[oklch(0.68_0.18_30/0.15)] text-[oklch(0.78_0.16_30)] ring-[oklch(0.68_0.18_30/0.25)]",
  };
  return `inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded ring-1 ring-inset ${m[s]}`;
}

function PointagePage() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );
  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState<"Tous" | Statut>("Tous");
  const [periode, setPeriode] = useState<"Aujourd'hui" | "Semaine" | "Mois">("Aujourd'hui");

  const filtered = useMemo(() => {
    return POINTAGES.filter((p) => {
      const matchS = filtre === "Tous" || p.statut === filtre;
      const matchQ = !search || p.nom.toLowerCase().includes(search.toLowerCase()) || p.departement.toLowerCase().includes(search.toLowerCase());
      return matchS && matchQ;
    });
  }, [search, filtre]);

  const stats = useMemo(() => {
    const present = POINTAGES.filter((p) => p.statut === "Présent" || p.statut === "En pause").length;
    const retards = POINTAGES.filter((p) => p.statut === "Retard").length;
    const absents = POINTAGES.filter((p) => p.statut === "Absent").length;
    const sortis = POINTAGES.filter((p) => p.statut === "Sorti").length;
    const taux = Math.round(((POINTAGES.length - absents) / POINTAGES.length) * 100);
    return { present, retards, absents, sortis, taux };
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Pointage QR" sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Header */}
          <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Suivi des présences</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Traçabilité en temps réel des entrées et sorties via QR code.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-md border border-border bg-card p-0.5">
                {(["Aujourd'hui", "Semaine", "Mois"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriode(p)}
                    className={`text-xs px-3 py-1.5 rounded transition-colors ${
                      periode === p ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* KPIs */}
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard label="Présents" value={stats.present} icon={Users} iconTone="green"
              trend={{ value: `${stats.taux}% de présence`, direction: "up", tone: "positive" }} />
            <KpiCard label="Entrées du jour" value={POINTAGES.filter(p => p.entree).length} icon={LogIn} iconTone="blue"
              trend={{ value: "Dernière à 09:32", direction: "up", tone: "neutral" }} />
            <KpiCard label="Sorties du jour" value={stats.sortis} icon={LogOut} iconTone="violet"
              trend={{ value: "Dernière à 13:02", direction: "flat", tone: "neutral" }} />
            <KpiCard label="Retards" value={stats.retards} icon={Clock} iconTone="amber"
              trend={{ value: "32 min en moyenne", direction: "down", tone: "negative" }} />
            <KpiCard label="Absents" value={stats.absents} icon={AlertTriangle} iconTone="red"
              trend={{ value: "Sans justificatif", direction: "flat", tone: "negative" }} />
          </section>

          {/* Main grid: Table + Sidebar */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Left: Presences table */}
            <div className="xl:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Présences du jour</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {filtered.length} stagiaire{filtered.length > 1 ? "s" : ""} · vendredi 5 juin 2026
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher…"
                      className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-border bg-background w-48 focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>
                </div>
              </div>

              {/* Status filter pills */}
              <div className="px-4 pt-3 pb-2 flex flex-wrap items-center gap-1.5 border-b border-border">
                <Filter className="h-3 w-3 text-muted-foreground mr-1" />
                {(["Tous", "Présent", "En pause", "Sorti", "Retard", "Absent"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFiltre(s)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      filtre === s
                        ? "bg-primary/15 border-primary/30 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="text-left px-4 py-2.5">Stagiaire</th>
                      <th className="text-left px-2 py-2.5">Département</th>
                      <th className="text-left px-2 py-2.5">Entrée</th>
                      <th className="text-left px-2 py-2.5">Sortie</th>
                      <th className="text-left px-2 py-2.5">Durée</th>
                      <th className="text-left px-2 py-2.5">Statut</th>
                      <th className="text-right px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-8 w-8 rounded-full grid place-items-center text-xs font-medium ${p.couleur}`}>
                              {p.initiale}
                            </div>
                            <div className="text-sm text-foreground leading-tight">{p.nom}</div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-xs text-muted-foreground">{p.departement}</td>
                        <td className="px-2 py-3">
                          {p.entree ? (
                            <span className="inline-flex items-center gap-1 text-xs tabular-nums text-foreground">
                              <LogIn className="h-3 w-3 text-success" />
                              {p.entree}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3">
                          {p.sortie ? (
                            <span className="inline-flex items-center gap-1 text-xs tabular-nums text-foreground">
                              <LogOut className="h-3 w-3 text-[oklch(0.78_0.16_295)]" />
                              {p.sortie}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-xs tabular-nums text-foreground">{p.duree}</td>
                        <td className="px-2 py-3">
                          <span className={statutBadge(p.statut)}>
                            {p.statut === "Présent" && <CheckCircle2 className="h-2.5 w-2.5" />}
                            {p.statut === "Absent" && <XCircle className="h-2.5 w-2.5" />}
                            {p.statut === "Retard" && <Clock className="h-2.5 w-2.5" />}
                            {p.statut}
                            {p.retard ? ` · +${p.retard}m` : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-primary transition-colors" title="Voir l'historique">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-xs text-muted-foreground">
                          Aucun pointage ne correspond à vos filtres.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column: Activity + QR */}
            <div className="space-y-4">
              {/* Live activity */}
              <div className="rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between p-4 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Activité en direct</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success"></span>
                      </span>
                      Temps réel
                    </p>
                  </div>
                  <button className="text-xs text-primary hover:underline">Tout voir →</button>
                </div>
                <ul className="divide-y divide-border max-h-[400px] overflow-y-auto">
                  {EVENTS.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                      <div className={`h-8 w-8 rounded-full grid place-items-center text-xs font-medium shrink-0 ${e.couleur}`}>
                        {e.initiale}
                      </div>
                      <div className="flex-1 min-w-0 leading-tight">
                        <div className="text-sm text-foreground truncate">{e.nom}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{e.departement}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide ${
                          e.type === "Entrée" ? "text-success" : "text-[oklch(0.78_0.16_295)]"
                        }`}>
                          {e.type === "Entrée" ? <LogIn className="h-2.5 w-2.5" /> : <LogOut className="h-2.5 w-2.5" />}
                          {e.type}
                        </div>
                        <div className="text-xs tabular-nums text-foreground">{e.heure}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Admin QR card */}
              <div className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/25 grid place-items-center text-primary">
                    <QrCode className="h-3.5 w-3.5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">QR de pointage du bureau</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Affiché à l'entrée. Les stagiaires scannent pour pointer leur arrivée et leur départ.
                </p>
                <div className="rounded-lg bg-background border border-border p-4 grid place-items-center">
                  <div className="h-40 w-40 rounded-md bg-foreground grid place-items-center">
                    <QrCode className="h-32 w-32 text-background" strokeWidth={1.2} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border bg-card hover:bg-muted/60 text-foreground transition-colors">
                    <Printer className="h-3.5 w-3.5" />
                    Imprimer
                  </button>
                  <button className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border bg-card hover:bg-muted/60 text-foreground transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                    Copier lien
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                    QR actif · régénéré il y a 2h
                  </span>
                  <button className="text-primary hover:underline">Régénérer</button>
                </div>
              </div>
            </div>
          </section>

          {/* Timeline of the day */}
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground inline-flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Chronologie de la journée
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Heures d'arrivée et de départ par stagiaire (08:00 – 18:00)</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Heure de pointe : 09:00
              </span>
            </div>

            {/* Hour scale */}
            <div className="relative">
              <div className="grid grid-cols-10 text-[10px] text-muted-foreground tabular-nums mb-1 pl-32">
                {Array.from({ length: 10 }, (_, i) => 8 + i).map((h) => (
                  <div key={h} className="border-l border-border/60 pl-1">{h}h</div>
                ))}
              </div>

              <ul className="space-y-1.5">
                {POINTAGES.filter(p => p.entree).map((p) => {
                  const [h, m] = (p.entree as string).split(":").map(Number);
                  const start = ((h + m / 60) - 8) / 10 * 100;
                  const endRaw = p.sortie
                    ? (() => { const [eh, em] = p.sortie.split(":").map(Number); return ((eh + em / 60) - 8) / 10 * 100; })()
                    : ((13 + 4 / 60) - 8) / 10 * 100; // "now" 13:04
                  const width = Math.max(2, endRaw - start);
                  const ongoing = !p.sortie;
                  return (
                    <li key={p.id} className="flex items-center gap-3">
                      <div className="w-32 flex items-center gap-2 shrink-0">
                        <div className={`h-6 w-6 rounded-full grid place-items-center text-[10px] font-medium ${p.couleur}`}>
                          {p.initiale}
                        </div>
                        <span className="text-xs text-foreground truncate">{p.nom}</span>
                      </div>
                      <div className="flex-1 relative h-6 rounded bg-muted/30 border border-border/60">
                        <div
                          className={`absolute top-0 bottom-0 rounded ${
                            ongoing
                              ? "bg-gradient-to-r from-primary/40 to-primary/20 border border-primary/40"
                              : "bg-gradient-to-r from-success/40 to-success/20 border border-success/40"
                          }`}
                          style={{ left: `${start}%`, width: `${width}%` }}
                        >
                          <div className="absolute inset-0 flex items-center justify-between px-1.5 text-[9px] tabular-nums">
                            <span className="text-foreground/80">{p.entree}</span>
                            {p.sortie && <span className="text-foreground/80">{p.sortie}</span>}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
