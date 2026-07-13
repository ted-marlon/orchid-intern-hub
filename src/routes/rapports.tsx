import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  FileText, FileCheck2, UserCheck, Search, Filter,
  CheckCircle2, Clock, AlertCircle, FileWarning, Mail,
  MessageCircle, Paperclip, Eye, Download, MoreHorizontal,
  CalendarDays, Send, X, Bell, ShieldCheck,
} from "lucide-react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { getAuthToken, getApiUrl } from "@/lib/api/auth";

export const Route = createFileRoute("/rapports")({
  head: () => ({
    meta: [
      { title: "Rapports — Orchid Island RH" },
      { name: "description", content: "Suivi des rapports journaliers et finaux des stagiaires d'Orchid Island Real Estate." },
    ],
  }),
  component: RapportsPage,
});

/* ------------------------ Types API ------------------------ */

type RapportJournalierAPI = {
  id: number;
  date_rapport: string;
  stagiaire: number;
  nom_stagiaire: string;
  taches_realisees: string;
  taches_en_cours: string;
  commentaire: string;
  depose: boolean;
  created_at: string;
};

type RapportFinalAPI = {
  id: number;
  stagiaire: number;
  nom_stagiaire: string;
  fichier: string | null;        // ✅ Nouveau nom (Cloudinary)
  fichier_url?: string | null;
  date_depot: string | null;
  statut_validation: 'valide' | 'en_attente' | 'refuse';
  commentaire_rh: string | null;
  nom_valide_par: string | null;
};

/* ------------------------ Types Frontend ------------------------ */

type StatutDepot = "Déposé" | "Manquant" | "En retard" | "Validé" | "En attente";
type Tab = "journaliers" | "finaux" | "suivi";

type RapportJournalier = {
  id: string;
  stagiaireId: string;
  nomStagiaire: string;
  date: string;
  statut: StatutDepot;
  fichier?: string;
  heure?: string;
  projet: string;
};

type RapportFinal = {
  id: string;
  stagiaireId: string;
  nomStagiaire: string;
  titre: string;
  date: string;
  statut: "Validé" | "En attente" | "À déposer";
  fichier?: string;
};

/* ------------------------ Helpers ------------------------ */

const TODAY = new Date().toISOString().split('T')[0];

function formatDateFr(iso: string | null) {
  if (!iso || iso === "—") return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getStagiaireUI(nom: string, id: number) {
  const noms = nom.split(' ');
  const initiale = (noms[0]?.[0] || '') + (noms[1]?.[0] || '');
  const couleurs = [
    "bg-primary/20 text-primary ring-primary/30",
    "bg-success/20 text-success ring-success/30",
    "bg-[oklch(0.68_0.18_295/0.2)] text-[oklch(0.78_0.16_295)] ring-[oklch(0.68_0.18_295/0.35)]",
    "bg-warning/20 text-warning ring-warning/30",
    "bg-destructive/20 text-destructive ring-destructive/30"
  ];
  const couleur = couleurs[id % couleurs.length];
  return { initiale: initiale.toUpperCase(), couleur };
}

function mapJournalierStatut(rapport: RapportJournalierAPI): StatutDepot {
  if (!rapport.depose) return "Manquant";
  const heure = new Date(rapport.created_at).getHours();
  return heure >= 18 ? "En retard" : "Déposé";
}

function mapFinalStatut(rapport: RapportFinalAPI): RapportFinal["statut"] {
  if (!rapport.fichier) return "À déposer";
  if (rapport.statut_validation === 'valide') return "Validé";
  return "En attente";
}

function mapApiJournalierToFrontend(r: RapportJournalierAPI): RapportJournalier {
  const ui = getStagiaireUI(r.nom_stagiaire, r.stagiaire);
  return {
    id: String(r.id),
    stagiaireId: String(r.stagiaire),
    nomStagiaire: r.nom_stagiaire,
    date: r.date_rapport,
    statut: mapJournalierStatut(r),
    fichier: r.depose ? `rapport-${r.stagiaire}-${r.date_rapport}.pdf` : undefined,
    heure: r.created_at ? new Date(r.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
    projet: "Projet Stagiaire",
  };
}

function mapApiFinalToFrontend(f: RapportFinalAPI): RapportFinal {
  return {
    id: String(f.id),
    stagiaireId: String(f.stagiaire),
    nomStagiaire: f.nom_stagiaire,
    titre: f.fichier ? "Mémoire de fin de stage" : "Rapport non déposé",
    date: f.date_depot || "—",
    statut: mapFinalStatut(f),
    fichier: f.fichier ? f.fichier.split('/').pop() : undefined,
  };
}

/* ------------------------ Page ------------------------ */

function RapportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );
  const [tab, setTab] = useState<Tab>("journaliers");
  const [query, setQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<"Tous" | StatutDepot>("Tous");
  
  const [journaliers, setJournaliers] = useState<RapportJournalier[]>([]);
  const [finaux, setFinaux] = useState<RapportFinal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRapports = async () => {
    setLoading(true);
    setError(null);
    
    const token = getAuthToken();
    console.log('🔑 Token:', token ? 'Présent' : 'Absent');
    console.log('📅 Date requise:', TODAY);
    
    if (!token) {
      setError('Token d\'authentification manquant. Veuillez vous reconnecter.');
      setLoading(false);
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    try {
      // Fetch journaliers
      console.log('📥 Fetch journaliers...');
      const urlJ = getApiUrl(`/api/rapports/journaliers/?date_rapport=${TODAY}`);
      console.log('URL:', urlJ);
      
      const resJ = await fetch(urlJ, { headers });
      console.log('📊 Response journaliers:', resJ.status, resJ.statusText);
      
      if (!resJ.ok) {
        const errorText = await resJ.text();
        console.error('❌ Erreur journaliers:', errorText);
        throw new Error(`Erreur journaliers: ${resJ.status}`);
      }
      
      const dataJ = await resJ.json();
      console.log('✅ Données journaliers reçues:', dataJ);
      
      const rawListJ = Array.isArray(dataJ) ? dataJ : dataJ.results || [];
      console.log('📋 Liste brute journaliers:', rawListJ.length, 'éléments');
      
      const mappedJ = rawListJ.map(mapApiJournalierToFrontend);
      console.log('🔄 Journaliers mappés:', mappedJ);

      // Fetch finaux
      console.log('📥 Fetch finaux...');
      const urlF = getApiUrl('/api/rapports/finaux/');
      console.log('URL:', urlF);
      
      const resF = await fetch(urlF, { headers });
      console.log('📊 Response finaux:', resF.status, resF.statusText);
      
      if (!resF.ok) {
        const errorText = await resF.text();
        console.error('❌ Erreur finaux:', errorText);
        throw new Error(`Erreur finaux: ${resF.status}`);
      }
      
      const dataF = await resF.json();
      console.log('✅ Données finaux reçues:', dataF);
      
      const rawListF = Array.isArray(dataF) ? dataF : dataF.results || [];
      console.log('📋 Liste brute finaux:', rawListF.length, 'éléments');
      
      const mappedF = rawListF.map(mapApiFinalToFrontend);
      console.log('🔄 Finaux mappés:', mappedF);

      setJournaliers(mappedJ);
      setFinaux(mappedF);
      setLoading(false);
      
      if (mappedJ.length === 0 && mappedF.length === 0) {
        setError('Aucun rapport trouvé dans la base de données.');
      }
      
    } catch (err) {
      console.error('💥 Erreur fetchRapports:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRapports();
  }, []);

  const kpis = {
    deposes: journaliers.filter((j) => j.statut === "Déposé" || j.statut === "En retard").length,
    manquants: journaliers.filter((j) => j.statut === "Manquant").length,
    finauxDeposes: finaux.filter((f) => f.statut !== "À déposer").length,
    finauxValides: finaux.filter((f) => f.statut === "Validé").length,
    enAttente: finaux.filter((f) => f.statut === "En attente").length,
  };

  const filteredJournaliers = useMemo(() => {
    return journaliers.filter((j) => {
      if (statutFilter !== "Tous" && j.statut !== statutFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return j.nomStagiaire.toLowerCase().includes(q) || j.projet.toLowerCase().includes(q);
      }
      return true;
    });
  }, [query, statutFilter, journaliers]);

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
          </div>

          {/* Error display */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <strong>⚠️ Erreur :</strong> {error}
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
            <KpiCard label="Rapports déposés aujourd'hui" value={String(kpis.deposes)} iconTone="green" icon={CheckCircle2} />
            <KpiCard label="Rapports manquants"          value={String(kpis.manquants)} iconTone="red"   icon={FileWarning} />
            <KpiCard label="Rapports finaux déposés"     value={String(kpis.finauxDeposes)} iconTone="blue" icon={FileCheck2} />
            <KpiCard label="Rapports finaux validés"     value={String(kpis.finauxValides)} iconTone="green" icon={ShieldCheck} />
            <KpiCard label="En attente de validation"    value={String(kpis.enAttente)} iconTone="amber" icon={Clock} />
          </div>

          {/* Tabs */}
          <div className="rounded-xl border border-border bg-card p-1 flex flex-wrap gap-1">
            <TabButton active={tab === "journaliers"} onClick={() => setTab("journaliers")} icon={FileText} label="Rapports Journaliers" />
            <TabButton active={tab === "finaux"}      onClick={() => setTab("finaux")}      icon={FileCheck2} label="Rapports Finaux de Stage" />
            <TabButton active={tab === "suivi"}       onClick={() => setTab("suivi")}       icon={UserCheck} label="Suivi par Stagiaire" />
          </div>

          {/* Tab content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Chargement des rapports...</span>
            </div>
          ) : (
            <>
              {tab === "journaliers" && (
                <JournaliersTab
                  rows={filteredJournaliers}
                  total={journaliers.length}
                  query={query} onQuery={setQuery}
                  statut={statutFilter} onStatut={setStatutFilter}
                />
              )}
              {tab === "finaux" && <FinauxTab rows={finaux} />}
              {tab === "suivi" && <SuiviTab journaliers={journaliers} finaux={finaux} />}
            </>
          )}
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
      </div>

      <div className="px-4 md:px-5 py-3 border-b border-border flex flex-col md:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Rechercher un stagiaire, un projet…"
            className="w-full h-9 pl-9 pr-9 rounded-md bg-background border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {query && (
            <button onClick={() => onQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium px-4 md:px-5 py-2.5">Stagiaire</th>
              <th className="text-left font-medium px-3 py-2.5">Date</th>
              <th className="text-left font-medium px-3 py-2.5">Statut</th>
              <th className="text-left font-medium px-3 py-2.5">Fichier</th>
              <th className="text-left font-medium px-3 py-2.5">Heure</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Aucun rapport journalier trouvé.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const ui = getStagiaireUI(r.nomStagiaire, parseInt(r.stagiaireId));
                const m = statutMeta(r.statut);
                const StatIcon = m.icon;
                return (
                  <tr key={r.id} className="border-t border-border/60 hover:bg-muted/20 transition-colors">
                    <td className="px-4 md:px-5 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`h-8 w-8 rounded-full grid place-items-center text-[11px] font-semibold ring-1 ring-inset ${ui.couleur}`}>
                          {ui.initiale}
                        </span>
                        <span className="text-sm text-foreground truncate">{r.nomStagiaire}</span>
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
                      <span className="text-xs tabular-nums text-foreground/80">{r.heure ?? "—"}</span>
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
        {rows.length === 0 ? (
          <div className="col-span-full py-10 text-center text-sm text-muted-foreground">
            Aucun rapport final trouvé.
          </div>
        ) : (
          rows.map((f) => {
            const ui = getStagiaireUI(f.nomStagiaire, parseInt(f.stagiaireId));
            const m = statutMeta(f.statut);
            const StatIcon = m.icon;
            return (
              <article key={f.id} className="rounded-lg border border-border bg-background/50 hover:border-border/80 hover:shadow-sm transition-all p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`h-9 w-9 rounded-full grid place-items-center text-[11px] font-semibold ring-1 ring-inset ${ui.couleur}`}>
                      {ui.initiale}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{f.nomStagiaire}</div>
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
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-muted-foreground/70 italic">Aucun fichier déposé</div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3" /> {formatDateFr(f.date)}
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

/* ------------------------ Tab: Suivi ------------------------ */

function SuiviTab({ journaliers, finaux }: { journaliers: RapportJournalier[], finaux: RapportFinal[] }) {
  const stagiaireIds = Array.from(new Set([...journaliers.map(j => j.stagiaireId), ...finaux.map(f => f.stagiaireId)]));
  
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 md:px-5 py-3.5 border-b border-border flex items-center gap-2.5">
        <UserCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Suivi par stagiaire</h3>
        <span className="text-[11px] text-muted-foreground">· {stagiaireIds.length} stagiaires</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium px-4 md:px-5 py-2.5">Stagiaire</th>
              <th className="text-left font-medium px-3 py-2.5">Journaliers</th>
              <th className="text-left font-medium px-3 py-2.5">Taux</th>
              <th className="text-left font-medium px-3 py-2.5">Rapport final</th>
            </tr>
          </thead>
          <tbody>
            {stagiaireIds.map((stagId) => {
              const stagJournaliers = journaliers.filter(j => j.stagiaireId === stagId);
              const deposes = stagJournaliers.filter(j => j.statut !== "Manquant").length;
              const total = stagJournaliers.length || 1;
              const pct = Math.round((deposes / total) * 100);
              const final = finaux.find(f => f.stagiaireId === stagId);
              const fm = final ? statutMeta(final.statut) : null;
              const FIcon = fm?.icon;
              const nomStagiaire = stagJournaliers[0]?.nomStagiaire || final?.nomStagiaire || 'Inconnu';
              const ui = getStagiaireUI(nomStagiaire, parseInt(stagId));
              
              return (
                <tr key={stagId} className="border-t border-border/60 hover:bg-muted/20 transition-colors">
                  <td className="px-4 md:px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-8 w-8 rounded-full grid place-items-center text-[11px] font-semibold ring-1 ring-inset ${ui.couleur}`}>
                        {ui.initiale}
                      </span>
                      <span className="text-sm text-foreground">{nomStagiaire}</span>
                    </div>
                  </td>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ------------------------ Helpers ------------------------ */

function statutMeta(s: StatutDepot | RapportFinal["statut"]) {
  switch (s) {
    case "Déposé":
    case "Validé":
      return { chip: "bg-success/15 text-success ring-success/30", icon: CheckCircle2 };
    case "En retard":
      return { chip: "bg-warning/15 text-warning ring-warning/30", icon: Clock };
    case "Manquant":
    case "À déposer":
      return { chip: "bg-destructive/15 text-destructive ring-destructive/30", icon: AlertCircle };
    case "En attente":
      return { chip: "bg-primary/15 text-primary ring-primary/30", icon: Clock };
    default:
      return { chip: "bg-muted/60 text-muted-foreground ring-border", icon: AlertCircle };
  }
}

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