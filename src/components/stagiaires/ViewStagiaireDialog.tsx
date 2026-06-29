import { useEffect, useState } from "react";
import { X, User, Mail, Phone, GraduationCap, Briefcase, Building2, Calendar, BadgeCheck } from "lucide-react";
import { getAuthToken } from "@/lib/api/auth";

type Props = {
  open: boolean;
  onClose: () => void;
  stagiaireId: string | null;
};

type StagiaireDetail = {
  id: string;
  nom: string;
  email: string;
  ecole: string;
  formation: string;
  departement: string;
  statut: string;
  absences: number;
  stageDebut: string;
  stageFin: string;
  rapport: string;
};

export function ViewStagiaireDialog({ open, onClose, stagiaireId }: Props) {
  const [stagiaire, setStagiaire] = useState<StagiaireDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !stagiaireId) return;
    
    setLoading(true);
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    fetch(`http://127.0.0.1:8000/api/stagiaires/${stagiaireId}/`, { headers })
      .then(res => res.json())
      .then(data => {
        setStagiaire({
          id: data.id,
          nom: `${data.user_nom} ${data.user_prenom}`,
          email: data.user_email,
          ecole: data.ecole,
          formation: data.formation,
          departement: data.departement?.nom || 'Non assigné',
          statut: data.stage_valide && data.date_fin ? 'Terminé' : 'En cours',
          absences: data.absences_nj_count,
          stageDebut: data.date_debut,
          stageFin: data.date_fin,
          rapport: data.rapport_final_depose ? 'Déposé' : 'Non déposé',
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching stagiaire:', err);
        setLoading(false);
      });
  }, [open, stagiaireId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-in fade-in"
      />

      <div className="relative w-full md:max-w-2xl max-h-[92vh] flex flex-col rounded-t-2xl md:rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 fade-in duration-200">
        <div className="flex items-start justify-between px-5 md:px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/25">
              <User className="h-4.5 w-4.5" />
            </div>
            <div className="leading-tight">
              <h2 className="text-base font-semibold text-foreground">Détails du stagiaire</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loading ? 'Chargement...' : stagiaire?.nom}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 md:px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-sm text-muted-foreground">Chargement...</span>
            </div>
          ) : stagiaire ? (
            <div className="space-y-6">
              <Section title="Informations personnelles" icon={User}>
                <InfoRow label="Nom complet" value={stagiaire.nom} icon={User} />
                <InfoRow label="Email" value={stagiaire.email} icon={Mail} />
              </Section>

              <Section title="Formation" icon={GraduationCap}>
                <InfoRow label="École" value={stagiaire.ecole} icon={GraduationCap} />
                <InfoRow label="Filière / Formation" value={stagiaire.formation} icon={Briefcase} />
                <InfoRow label="Département" value={stagiaire.departement} icon={Building2} />
              </Section>

              <Section title="Stage" icon={Calendar}>
                <InfoRow label="Date de début" value={stagiaire.stageDebut} icon={Calendar} />
                <InfoRow label="Date de fin" value={stagiaire.stageFin} icon={Calendar} />
                <InfoRow label="Statut" value={stagiaire.statut} icon={BadgeCheck} />
              </Section>

              <Section title="Suivi" icon={BadgeCheck}>
                <InfoRow label="Absences non justifiées" value={`${stagiaire.absences}/3`} icon={Phone} />
                <InfoRow label="Rapport final" value={stagiaire.rapport} icon={BadgeCheck} />
              </Section>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <span className="text-sm text-muted-foreground">Erreur lors du chargement</span>
            </div>
          )}
        </div>

        <div className="px-5 md:px-6 py-3.5 border-t border-border bg-card/60 backdrop-blur sticky bottom-0 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-md text-sm text-foreground bg-background border border-border hover:bg-muted/60 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          {title}
        </h3>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon: typeof User }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}
