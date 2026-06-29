import { useEffect, useState } from "react";
import { X, User, Mail, Phone, GraduationCap, Briefcase, Building2, Calendar, Check, AlertCircle } from "lucide-react";
import { getAuthToken } from "@/lib/api/auth";

type Props = {
  open: boolean;
  onClose: () => void;
  stagiaireId: string | null;
  onSubmit: () => void;
};

type FormState = {
  ecole: string;
  formation: string;
  telephone: string;
  departement: string;
  date_debut: string;
  date_fin: string;
};

const DEPARTEMENTS = ["Marketing", "IT", "RH", "Comptabilité"];

export function EditStagiaireDialog({ open, onClose, stagiaireId, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>({
    ecole: "", formation: "", telephone: "", departement: "",
    date_debut: "", date_fin: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setForm({
          ecole: data.ecole || "",
          formation: data.formation || "",
          telephone: data.telephone || "",
          departement: data.departement?.nom || "",
          date_debut: data.date_debut || "",
          date_fin: data.date_fin || "",
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching stagiaire:', err);
        setLoading(false);
      });
  }, [open, stagiaireId]);

  if (!open) return null;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    
    try {
      const departementMap: Record<string, number> = {
        "Marketing": 1,
        "IT": 3,
        "RH": 2,
        "Comptabilité": 4,
      };
      
      const payload = {
        ecole: form.ecole,
        formation: form.formation,
        telephone: form.telephone,
        departement: departementMap[form.departement] || null,
        date_debut: form.date_debut,
        date_fin: form.date_fin,
      };
      
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://127.0.0.1:8000/api/stagiaires/${stagiaireId}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la modification du stagiaire');
      }
      
      onSubmit();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

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
              <h2 className="text-base font-semibold text-foreground">Modifier le stagiaire</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mettez à jour les informations du stage.
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 md:px-6 py-5 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <span className="text-sm text-muted-foreground">Chargement...</span>
              </div>
            ) : (
              <>
                <Section title="Formation" icon={GraduationCap}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="École" icon={GraduationCap}>
                      <Input value={form.ecole} onChange={(v) => set("ecole", v)} placeholder="ENSA Marrakech" hasIcon />
                    </Field>
                    <Field label="Filière / Formation" icon={Briefcase}>
                      <Input value={form.formation} onChange={(v) => set("formation", v)} placeholder="Génie informatique" hasIcon />
                    </Field>
                    <Field label="Téléphone" icon={Phone}>
                      <Input value={form.telephone} onChange={(v) => set("telephone", v)} placeholder="+212 6XX XXX XXX" hasIcon />
                    </Field>
                    <Field label="Département" icon={Building2}>
                      <Select value={form.departement} onChange={(v) => set("departement", v)} hasIcon>
                        <option value="">Sélectionner…</option>
                        {DEPARTEMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </Select>
                    </Field>
                  </div>
                </Section>

                <Section title="Période de stage" icon={Calendar}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Date début" icon={Calendar}>
                      <Input type="date" value={form.date_debut} onChange={(v) => set("date_debut", v)} hasIcon />
                    </Field>
                    <Field label="Date fin" icon={Calendar}>
                      <Input type="date" value={form.date_fin} onChange={(v) => set("date_fin", v)} hasIcon />
                    </Field>
                  </div>
                </Section>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-5 md:px-6 py-3.5 border-t border-border bg-card/60 backdrop-blur sticky bottom-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-md text-sm text-foreground bg-background border border-border hover:bg-muted/60 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 transition-colors"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Modification...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          {title}
        </h3>
        <div className="flex-1 h-px bg-border" />
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: typeof User; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-[11px] font-medium text-foreground/80 mb-1">
        {label}
      </span>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        )}
        {children}
      </div>
    </label>
  );
}

type InputProps = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  hasIcon?: boolean;
};

const Input = ({ value, onChange, placeholder, type = "text", className = "", hasIcon }: InputProps) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-9 ${hasIcon ? "pl-9" : "pl-3"} pr-3 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors ${className}`}
    />
  );
};

function Select({ value, onChange, children, hasIcon }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  hasIcon?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full h-9 ${hasIcon ? "pl-9" : "pl-3"} pr-3 rounded-md bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors`}
    >
      {children}
    </select>
  );
}
