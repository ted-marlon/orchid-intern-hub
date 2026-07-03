import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  QrCode, Users, LogIn, LogOut, Clock, Search,
  CheckCircle2, AlertTriangle, XCircle, Filter,
  Printer, Copy, Eye,
} from "lucide-react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { getAuthToken, getApiUrl } from "@/lib/api/auth";

export const Route = createFileRoute("/pointage")({
  head: () => ({
    meta: [
      { title: "Pointage QR — Orchid Island RH" },
      { name: "description", content: "Suivi des présences via QR code." },
    ],
  }),
  component: PointagePage,
});

/* ---- Types ---- */

type PresenceAPI = {
  id: number;
  stagiaire: number;
  nom_stagiaire: string;
  prenom_stagiaire: string;
  departement: string;
  date: string;
  heure_entree: string | null;
  heure_sortie: string | null;
  statut: "present" | "absent" | "en_pause";
  justification: string | null;
  est_justifiee: boolean;
};

type DashboardResponse = {
  kpis: {
    presents: number;
    absents: number;
    entrees: number;
    sortis: number;
    retards: number;
    retard_moyen: number;
    taux_presence: number;
  };
  presences: PresenceAPI[];
};

type StatutUI = "Présent" | "Sorti" | "En pause" | "Absent" | "Retard";

type Pointage = {
  id: string;
  nom: string;
  initiale: string;
  couleur: string;
  departement: string;
  entree: string | null;
  sortie: string | null;
  duree: string;
  statut: StatutUI;
  retard?: number;
  date: string;
  statut_backend: string;
  est_justifiee: boolean;
};

/* ---- Couleurs avatar ---- */
const COULEURS = [
  "bg-primary/20 text-primary",
  "bg-success/20 text-success",
  "bg-[oklch(0.68_0.18_295/0.2)] text-[oklch(0.78_0.16_295)]",
  "bg-warning/20 text-warning",
  "bg-destructive/20 text-destructive",
];

/* ---- Calcul durée ---- */
function calculerDuree(entree: string | null, sortie: string | null): string {
  if (!entree) return "—";
  if (!sortie) return "—";
  const [h1, m1] = entree.split(":").map(Number);
  const now = new Date();
  const [h2, m2] = sortie
    ? sortie.split(":").map(Number)
    : [now.getHours(), now.getMinutes()];
  const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diff <= 0) return "—";
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}

/* ---- Mapping API → UI ---- */
function mapPresence(p: PresenceAPI, index: number): Pointage {
  const nom = `${p.nom_stagiaire} ${p.prenom_stagiaire}`.trim();
  const initiale = nom
    .split(" ")
    .filter(Boolean)
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || `S${index + 1}`;

  const entree = p.heure_entree ? p.heure_entree.slice(0, 5) : null;
  const sortie = p.heure_sortie ? p.heure_sortie.slice(0, 5) : null;

  let statut: StatutUI = "Absent";
  let retard: number | undefined;

  if (p.statut === "absent") {
    statut = "Absent";
  } else if (sortie) {
    statut = "Sorti";
  } else if (entree) {
    const [h, m] = entree.split(":").map(Number);
    const minutesEntree = h * 60 + m;
    const limite = 9 * 60;
    if (minutesEntree > limite) {
      statut = "Retard";
      retard = minutesEntree - limite;
    } else if (p.statut === "en_pause") {
      statut = "En pause";
    } else {
      statut = "Présent";
    }
  }

  return {
    id: String(p.id),
    nom,
    initiale,
    couleur: COULEURS[index % COULEURS.length],
    departement: p.departement || "—",
    entree,
    sortie,
    duree: calculerDuree(entree, sortie),
    statut,
    retard,
    date: p.date,
    statut_backend: p.statut,
    est_justifiee: p.est_justifiee,
  };
}

/* ---- Helpers UI ---- */
function statutBadge(s: StatutUI) {
  const styles: Record<StatutUI, string> = {
    "Présent":  "bg-success/15 text-success ring-success/25",
    "En pause": "bg-warning/15 text-warning ring-warning/25",
    "Sorti":    "bg-muted/60 text-muted-foreground ring-border",
    "Absent":   "bg-destructive/15 text-destructive ring-destructive/25",
    "Retard":   "bg-orange-500/15 text-orange-400 ring-orange-500/25",
  };
  return `inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded ring-1 ring-inset ${styles[s]}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function dernierPointage(times: (string | null)[]): string | null {
  const valides = times.filter(Boolean) as string[];
  if (!valides.length) return null;
  return valides.reduce((a, b) => timeToMinutes(b) > timeToMinutes(a) ? b : a);
}
function formatQR(base64: string) {
  if (!base64) return "";
  if (base64.startsWith("data:image")) return base64;
  return `data:image/png;base64,${base64}`;
}
/* ---- Page ---- */
function PointagePage() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768
  );
  const [pointages, setPointages]   = useState<Pointage[]>([]);
  const [dashboard, setDashboard]   = useState<DashboardResponse | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [filtre, setFiltre]         = useState<"Tous" | StatutUI>("Tous");
  const [periode, setPeriode]       = useState<"Aujourd'hui" | "Semaine" | "Mois">("Aujourd'hui");

  /* ---- Chargement depuis /api/presences/dashboard/ ---- */
  useEffect(() => {
    const token = getAuthToken();
    fetch(getApiUrl("/api/presences/dashboard/"), {  // ✅ nouvel endpoint
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: DashboardResponse) => {
        
        setDashboard(data);                              // ✅ stocke les kpis
        setPointages(data.presences.map(mapPresence));  // ✅ mappe data.presences
        setLoading(false);
      })
      .catch(err => {
        setError(`Impossible de charger les présences : ${err.message}`);
        setLoading(false);
      });
  }, []);
type QRResponse = {
  entree: string;
  sortie: string;
  date: string;
};

const [qr, setQr] = useState<QRResponse | null>(null);

useEffect(() => {
  const token = getAuthToken();

  fetch(getApiUrl("/api/presences/get-daily-qrs/"), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data: QRResponse) => {
      setQr(data);
    })
    .catch(err => {
      console.error("QR error:", err);
    });
}, []);
  /* ---- Filtrage par période ---- */
  const pointagesParPeriode = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return pointages.filter(p => {
      const d = new Date(p.date);
      if (periode === "Aujourd'hui") {
  return p.date === new Date().toLocaleDateString("sv-SE");
}
      if (periode === "Semaine") {
        const lundi = new Date(today);
        lundi.setDate(today.getDate() - (today.getDay() || 7) + 1);
        const dimanche = new Date(lundi);
        dimanche.setDate(lundi.getDate() + 6);
        return d >= lundi && d <= dimanche;
      }
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
  }, [pointages, periode]);

  /* ---- Filtrage recherche + statut ---- */
  const filtered = useMemo(() => {
    return pointagesParPeriode.filter(p => {
      if (filtre !== "Tous" && p.statut !== filtre) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.nom.toLowerCase().includes(q) || p.departement.toLowerCase().includes(q);
      }
      return true;
    });
  }, [pointagesParPeriode, filtre, search]);

  /* ---- KPIs : backend pour aujourd'hui, calcul local pour semaine/mois ---- */
  const stats = useMemo(() => {
    // Pour "Aujourd'hui" → on utilise les KPIs précalculés par le backend (plus précis)
    if (dashboard && periode === "Aujourd'hui") {
      return {
        presents:    dashboard.kpis.presents,
        sortis:      dashboard.kpis.sortis,
        retards:     dashboard.kpis.retards,
        absents:     dashboard.kpis.absents,
        taux:        dashboard.kpis.taux_presence,
        retardMoyen: dashboard.kpis.retard_moyen,
        entrees:     dashboard.kpis.entrees,
      };
    }
    // Pour "Semaine" / "Mois" → calcul local depuis les données filtrées
    const presents  = pointagesParPeriode.filter(p => p.statut === "Présent" || p.statut === "En pause").length;
    const sortis    = pointagesParPeriode.filter(p => p.statut === "Sorti").length;
    const retards   = pointagesParPeriode.filter(p => p.statut === "Retard").length;
    const absents   = pointagesParPeriode.filter(p => p.statut === "Absent").length;
    const entrees   = pointagesParPeriode.filter(p => p.entree).length;
    const total     = pointagesParPeriode.length;
    const taux      = total > 0 ? Math.round(((total - absents) / total) * 100) : 0;
    const retardMoyen = retards > 0
      ? Math.round(pointagesParPeriode.filter(p => p.retard).reduce((sum, p) => sum + (p.retard ?? 0), 0) / retards)
      : 0;
    return { presents, sortis, retards, absents, taux, retardMoyen, entrees };
  }, [dashboard, pointagesParPeriode, periode]);

  /* ---- Rendu ---- */
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="Pointage QR"
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(v => !v)}
        />

        <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">

          {/* Header + sélecteur période */}
          <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Suivi des présences</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Traçabilité en temps réel des entrées et sorties via QR code.
              </p>
            </div>
            <div className="inline-flex rounded-md border border-border bg-card p-0.5">
              {(["Aujourd'hui", "Semaine", "Mois"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriode(p)}
                  className={`text-xs px-3 py-1.5 rounded transition-colors ${
                    periode === p
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </section>

          {/* KPIs */}
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard
              label="Présents"
              value={loading ? "…" : String(stats.presents)}
              icon={Users}
              iconTone="green"
              trend={{ value: `${stats.taux}% de présence`, direction: "up", tone: "positive" }}
            />
            <KpiCard
              label="Entrées"
              value={loading ? "…" : String(stats.entrees)}
              icon={LogIn}
              iconTone="blue"
              trend={{
                value: dernierPointage(pointagesParPeriode.map(p => p.entree))
                  ? `Dernière à ${dernierPointage(pointagesParPeriode.map(p => p.entree))?.replace(":", "h")}`
                  : "—",
                direction: "up",
                tone: "neutral",
              }}
            />
            <KpiCard
              label="Sorties"
              value={loading ? "…" : String(stats.sortis)}
              icon={LogOut}
              iconTone="violet"
              trend={{
                value: dernierPointage(pointagesParPeriode.map(p => p.sortie))
                  ? `Dernière à ${dernierPointage(pointagesParPeriode.map(p => p.sortie))?.replace(":", "h")}`
                  : "—",
                direction: "flat",
                tone: "neutral",
              }}
            />
            <KpiCard
              label="Retards"
              value={loading ? "…" : String(stats.retards)}
              icon={Clock}
              iconTone="amber"
              trend={{
                value: stats.retards > 0 ? `${stats.retardMoyen} min en moyenne` : "Aucun retard",
                direction: stats.retards > 0 ? "down" : "flat",
                tone: stats.retards > 0 ? "negative" : "neutral",
              }}
            />
            <KpiCard
              label="Absents"
              value={loading ? "…" : String(stats.absents)}
              icon={AlertTriangle}
              iconTone="red"
              trend={{ value: "Sans justificatif", direction: "flat", tone: "negative" }}
            />
          </section>

          {/* Tableau + QR */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">

            {/* Tableau */}
            <div className="xl:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Présences</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {filtered.length} stagiaire{filtered.length > 1 ? "s" : ""} ·{" "}
                    {new Date().toLocaleDateString("fr-FR", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher…"
                    className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-border bg-background w-48 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>

              {error && (
                <div className="px-4 py-2 text-[11px] text-destructive bg-destructive/10 border-b border-destructive/20">
                  {error}
                </div>
              )}

              {/* Filtres statut */}
              <div className="px-4 pt-3 pb-2 flex flex-wrap items-center gap-1.5 border-b border-border">
                <Filter className="h-3 w-3 text-muted-foreground mr-1" />
                {(["Tous", "Présent", "En pause", "Sorti", "Retard", "Absent"] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFiltre(s as "Tous" | StatutUI)}
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

              {loading ? (
                <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                  Chargement des présences…
                </div>
              ) : (
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
                      {filtered.map(p => (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`h-8 w-8 rounded-full grid place-items-center text-xs font-medium ${p.couleur}`}>
                                {p.initiale}
                              </div>
                              <span className="text-sm text-foreground">{p.nom}</span>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-xs text-muted-foreground">{p.departement}</td>
                          <td className="px-2 py-3">
                            {p.entree
                              ? <span className="inline-flex items-center gap-1 text-xs tabular-nums text-foreground"><LogIn className="h-3 w-3 text-success" />{p.entree}</span>
                              : <span className="text-xs text-muted-foreground">—</span>
                            }
                          </td>
                          <td className="px-2 py-3">
                            {p.sortie
                              ? <span className="inline-flex items-center gap-1 text-xs tabular-nums text-foreground"><LogOut className="h-3 w-3 text-violet-400" />{p.sortie}</span>
                              : <span className="text-xs text-muted-foreground">—</span>
                            }
                          </td>
                          <td className="px-2 py-3 text-xs tabular-nums text-foreground">{p.duree}</td>
                          <td className="px-2 py-3">
                            <span className={statutBadge(p.statut)}>
                              {p.statut === "Présent"  && <CheckCircle2 className="h-2.5 w-2.5" />}
                              {p.statut === "Absent"   && <XCircle className="h-2.5 w-2.5" />}
                              {p.statut === "Retard"   && <Clock className="h-2.5 w-2.5" />}
                              {p.statut === "En pause" && <AlertTriangle className="h-2.5 w-2.5" />}
                              {p.statut}
                              {p.retard ? ` · +${p.retard}m` : ""}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-primary transition-colors"
                              title="Voir le détail"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && !loading && (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-xs text-muted-foreground">
                            {error ? "Erreur de chargement." : "Aucun pointage pour cette période."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/25 grid place-items-center text-primary">
                  <QrCode className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">QR de pointage</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Affiché à l'entrée. Les stagiaires scannent pour pointer leur arrivée et départ.
              </p>
              <div className="rounded-lg bg-background border border-border p-4 grid place-items-center">
                {qr ? (
  <div className="flex flex-col items-center gap-4">
    <div className="text-center">
      <img
        src={formatQR(qr.entree)}
        alt="QR Entrée"
        className="h-40 w-40 rounded-md border bg-white"
      />
      <p className="text-xs mt-2 text-muted-foreground">Entrée</p>
    </div>

    <div className="text-center">
      <img
        src={formatQR(qr.sortie)}
        alt="QR Sortie"
        className="h-40 w-40 rounded-md border bg-white"
      />
      <p className="text-xs mt-2 text-muted-foreground">Sortie</p>
    </div>
  </div>
) : (
  <div className="h-40 w-40 rounded-md bg-muted animate-pulse" />
)}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border bg-card hover:bg-muted/60 text-foreground transition-colors">
                  <Printer className="h-3.5 w-3.5" /> Imprimer
                </button>
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border bg-card hover:bg-muted/60 text-foreground transition-colors">
                  <Copy className="h-3.5 w-3.5" /> Copier lien
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  QR actif · régénéré il y a 2h
                </span>
                <button className="text-primary hover:underline">Régénérer</button>
              </div>
            </div>

          </section>
        </main>
      </div>
    </div>
  );
}