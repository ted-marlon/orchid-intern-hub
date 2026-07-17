import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { 
  FileText, Calendar, RefreshCw, ShieldAlert, Download, Eye, 
  Upload, CheckCircle2, AlertCircle, Clock, FileCheck2, X, Plus
} from "lucide-react";
import { getAuthToken, getApiUrl } from "@/lib/api/auth";
import { useRouter } from "@tanstack/react-router";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";

export const Route = createFileRoute("/mes-rapports")({
  head: () => ({
    meta: [
      { title: "Mes Rapports — Orchid Island RH" },
      { name: "description", content: "Consultez et déposez vos rapports journaliers et finaux." },
    ],
  }),
  component: MesRapportsPage,
});

type RapportJournalier = {
  id: number;
  date_rapport: string;
  taches_realisees: string;
  commentaire: string;
  depose: boolean;
  created_at: string;
};

type RapportFinal = {
  id: number;
  fichier: string | null;
  fichier_url: string | null;
  date_depot: string | null;
  statut_validation: 'en_attente' | 'valide' | 'refuse';
  commentaire_rh: string | null;
};

function MesRapportsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stagiaireId, setStagiaireId] = useState<number | null>(null);
  
  const [journaliers, setJournaliers] = useState<RapportJournalier[]>([]);
  const [rapportFinal, setRapportFinal] = useState<RapportFinal | null>(null);
  
  const [loading, setLoading] = useState(true);
  
  // États pour le formulaire journalier
  const [showJournalierForm, setShowJournalierForm] = useState(false);
  const [journalierData, setJournalierData] = useState({ taches_realisees: '', commentaire: '' });
  const [submittingJournalier, setSubmittingJournalier] = useState(false);

  // États pour l'upload final
  const [finalFile, setFinalFile] = useState<File | null>(null);
  const [uploadingFinal, setUploadingFinal] = useState(false);

  // 1. Récupérer utilisateur et ID stagiaire
  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = getAuthToken();
      if (!token) {
        router.navigate({ to: "/login" });
        return;
      }

      try {
        const resUser = await fetch(getApiUrl("/api/users/me/"), {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        
        if (resUser.ok) {
          const userData = await resUser.json();
          setUserRole(userData.role);
          
          if (userData.role !== 'stagiaire') {
            router.navigate({ to: "/" });
            return;
          }

          // Récupérer l'ID du stagiaire
          const resStagiaires = await fetch(getApiUrl("/api/stagiaires/"), {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          });
          
          if (resStagiaires.ok) {
            const stagiairesData = await resStagiaires.json();
            const allStagiaires = Array.isArray(stagiairesData) ? stagiairesData : stagiairesData.results || [];
            const stagiaire = allStagiaires.find((s: any) => s.user_email === userData.email || s.user === userData.id);
            
            if (stagiaire) {
              setStagiaireId(stagiaire.id);
            }
          }
        } else {
          router.navigate({ to: "/login" });
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        router.navigate({ to: "/login" });
      }
    };
    fetchUserInfo();
  }, [router]);

  // 2. Récupérer les rapports une fois le stagiaireId connu
  useEffect(() => {
    const fetchReports = async () => {
      if (!stagiaireId) return;
      const token = getAuthToken();

      try {
        // Fetch Rapports Journaliers
        const resJ = await fetch(getApiUrl(`/api/rapports/journaliers/?stagiaire=${stagiaireId}`), {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (resJ.ok) {
          const dataJ = await resJ.json();
          setJournaliers(Array.isArray(dataJ) ? dataJ : dataJ.results || []);
        }

        // Fetch Rapport Final
        const resF = await fetch(getApiUrl(`/api/rapports/finaux/?stagiaire=${stagiaireId}`), {
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
        if (resF.ok) {
          const dataF = await resF.json();
          const finals = Array.isArray(dataF) ? dataF : dataF.results || [];
          setRapportFinal(finals.length > 0 ? finals[0] : null); // On prend le premier (ou le plus récent)
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    };

    if (stagiaireId !== null) {
      fetchReports();
    }
  }, [stagiaireId]);

  // Helpers
  const formatDate = (dateString: string) => {
    if (!dateString) return "Non définie";
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatutFinalConfig = (statut: string) => {
    switch (statut) {
      case 'valide': return { label: 'Validé', icon: CheckCircle2, color: 'text-green-400 bg-green-500/10 border-green-500/20' };
      case 'refuse': return { label: 'Refusé', icon: AlertCircle, color: 'text-red-400 bg-red-500/10 border-red-500/20' };
      default: return { label: 'En attente', icon: Clock, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    }
  };

  // Actions
  const handleJournalierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stagiaireId) return;
    setSubmittingJournalier(true);

    const today = new Date().toISOString().split('T')[0];
    const payload = {
      stagiaire: stagiaireId,
      date_rapport: today,
      taches_realisees: journalierData.taches_realisees,
      commentaire: journalierData.commentaire,
      depose: true
    };

    try {
      const res = await fetch(getApiUrl("/api/rapports/journaliers/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newReport = await res.json();
        setJournaliers([newReport, ...journaliers]);
        setJournalierData({ taches_realisees: '', commentaire: '' });
        setShowJournalierForm(false);
      }
    } catch (err) {
      console.error("Error submitting daily report:", err);
    } finally {
      setSubmittingJournalier(false);
    }
  };

  const handleFinalUpload = async () => {
    if (!finalFile || !stagiaireId) return;
    setUploadingFinal(true);

    const formData = new FormData();
    formData.append("fichier", finalFile);
    formData.append("stagiaire", String(stagiaireId));
    formData.append("depose", "true");

    try {
      const res = await fetch(getApiUrl("/api/rapports/finaux/"), {
        method: "POST",
        headers: { Authorization: `Bearer ${getAuthToken()}` }, // Pas de Content-Type, le navigateur le gère pour FormData
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setRapportFinal(data);
        setFinalFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        const errData = await res.json();
        alert(`Erreur: ${errData.fichier?.[0] || "Échec de l'upload"}`);
      }
    } catch (err) {
      console.error("Error uploading final report:", err);
      alert("Une erreur réseau est survenue.");
    } finally {
      setUploadingFinal(false);
    }
  };

  // Rendus conditionnels
  if (userRole === null || stagiaireId === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (userRole !== 'stagiaire') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-destructive" />
        <h1 className="text-xl font-semibold text-foreground mb-2">Accès refusé</h1>
        <p className="text-sm text-muted-foreground mb-4">Cette page est réservée aux stagiaires.</p>
        <button onClick={() => router.navigate({ to: "/" })} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Mes Rapports" sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />

        <main className="flex-1 p-4 md:p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Mes Rapports</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Gérez vos rapports journaliers et votre rapport final de stage.</p>
          </div>

          {/* SECTION 1: RAPPORT FINAL */}
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent flex items-center gap-3">
              <FileCheck2 className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Rapport Final de Stage</h3>
            </div>
            
            <div className="p-5">
              {!rapportFinal ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Déposez votre rapport final de stage au format PDF. Une fois soumis, il sera en attente de validation par les RH.
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setFinalFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted/60 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      {finalFile ? finalFile.name : "Choisir un fichier PDF"}
                    </button>
                    
                    {finalFile && (
                      <>
                        <button
                          onClick={handleFinalUpload}
                          disabled={uploadingFinal}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {uploadingFinal ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          {uploadingFinal ? "Envoi..." : "Déposer le rapport"}
                        </button>
                        <button onClick={() => { setFinalFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="p-2 text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Rapport final déposé</h4>
                      <p className="text-xs text-muted-foreground mt-1">Déposé le {formatDate(rapportFinal.date_depot || "")}</p>
                      {rapportFinal.commentaire_rh && (
                        <p className="text-xs text-muted-foreground mt-2 italic bg-muted/50 p-2 rounded">
                          "Note RH : {rapportFinal.commentaire_rh}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {(() => {
                      const config = getStatutFinalConfig(rapportFinal.statut_validation);
                      const Icon = config.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${config.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {config.label}
                        </span>
                      );
                    })()}
                    
                    {rapportFinal.fichier_url && (
                      <a 
                        href={rapportFinal.fichier_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium hover:bg-muted/60 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> Voir
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 2: RAPPORTS JOURNALIERS */}
          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Rapports Journaliers</h3>
                <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                  {journaliers.length} déposé(s)
                </span>
              </div>
              <button
                onClick={() => setShowJournalierForm(!showJournalierForm)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Rapport du jour
              </button>
            </div>

            {showJournalierForm && (
              <div className="p-5 border-b border-border bg-muted/20">
                <form onSubmit={handleJournalierSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Tâches réalisées aujourd'hui *</label>
                    <textarea
                      value={journalierData.taches_realisees}
                      onChange={(e) => setJournalierData({ ...journalierData, taches_realisees: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[80px]"
                      placeholder="Décrivez brièvement vos activités de la journée..."
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Commentaire / Blocage (optionnel)</label>
                    <input
                      type="text"
                      value={journalierData.commentaire}
                      onChange={(e) => setJournalierData({ ...journalierData, commentaire: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="Ex: En attente de validation sur le module X..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowJournalierForm(false)} className="px-4 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted/60 transition-colors">
                      Annuler
                    </button>
                    <button type="submit" disabled={submittingJournalier} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                      {submittingJournalier && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                      Soumettre
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="divide-y divide-border">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : journaliers.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Aucun rapport journalier soumis pour le moment.</p>
                </div>
              ) : (
                journaliers.map((report) => (
                  <div key={report.id} className="p-4 md:p-5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {formatDate(report.date_rapport)}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                            Déposé
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 line-clamp-2">{report.taches_realisees}</p>
                        {report.commentaire && (
                          <p className="text-xs text-muted-foreground italic bg-muted/50 p-2 rounded inline-block">
                            Note: {report.commentaire}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground tabular-nums pt-1">
                        {new Date(report.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}