import { forwardRef, useEffect, useRef, useState } from "react";
import {
  X, FolderKanban, FileText, Users, Building2, Calendar, Flag,
  Activity, Check, AlertCircle, Search,
} from "lucide-react";

type Statut = "En cours" | "En retard" | "Terminé" | "En pause";
type Priorite = "Haute" | "Moyenne" | "Basse";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: FormState) => void;
};

export type FormState = {
  nom: string;
  description: string;
  client: string;
  departement: string;
  priorite: Priorite;
  statut: Statut;
  dateDebut: string;
  dateFin: string;
  stagiaires: string[];
};

const EMPTY: FormState = {
  nom: "", description: "", client: "", departement: "",
  priorite: "Moyenne", statut: "En cours",
  dateDebut: "", dateFin: "", stagiaires: [],
};

const DEPARTEMENTS = ["Marketing", "IT", "RH", "Ventes", "Comptabilité", "Projets"];

const STAGIAIRES = [
  { id: "1", nom: "Youssef Bennani", initiale: "YB", couleur: "bg-primary/20 text-primary" },
  { id: "2", nom: "Oumaima El Idrissi", initiale: "OE", couleur: "bg-success/20 text-success" },
  { id: "3", nom: "Mehdi Cherkaoui", initiale: "MC", couleur: "bg-[oklch(0.68_0.18_295/0.2)] text-[oklch(0.78_0.16_295)]" },
  { id: "4", nom: "Aya Fassi", initiale: "AF", couleur: "bg-success/20 text-success" },
  { id: "5", nom: "Hamza Naciri", initiale: "HN", couleur: "bg-warning/20 text-warning" },
  { id: "6", nom: "Lina Amrani", initiale: "LA", couleur: "bg-destructive/20 text-destructive" },
  { id: "7", nom: "Salma Tahiri", initiale: "ST", couleur: "bg-warning/20 text-warning" },
  { id: "8", nom: "Rim Belghazi", initiale: "RB", couleur: "bg-primary/20 text-primary" },
];

export function NewProjetDialog({ open, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [stagSearch, setStagSearch] = useState("");
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => firstInputRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const errors = {
    nom: !form.nom.trim(),
    description: form.description.trim().length < 5,
    dateFin: !!form.dateDebut && !!form.dateFin && form.dateFin < form.dateDebut,
  };
  const isValid = !errors.nom && !errors.description && !errors.dateFin;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit?.(form);
    setForm(EMPTY);
    setTouched(false);
    setStagSearch("");
    onClose();
  }

  function handleClose() {
    setForm(EMPTY);
    setTouched(false);
    setStagSearch("");
    onClose();
  }

  function toggleStag(id: string) {
    set("stagiaires", form.stagiaires.includes(id)
      ? form.stagiaires.filter((x) => x !== id)
      : [...form.stagiaires, id]);
  }

  const filteredStag = STAGIAIRES.filter((s) =>
    !stagSearch || s.nom.toLowerCase().includes(stagSearch.toLowerCase()),
  );

  const durationDays = (() => {
    if (!form.dateDebut || !form.dateFin) return null;
    const d = (new Date(form.dateFin).getTime() - new Date(form.dateDebut).getTime()) / 86400000;
    return d >= 0 ? Math.round(d) : null;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <button
        aria-label="Fermer"
        onClick={handleClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-in fade-in"
      />

      <div className="relative w-full md:max-w-2xl max-h-[92vh] flex flex-col rounded-t-2xl md:rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between px-5 md:px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[oklch(0.68_0.18_295/0.15)] text-[oklch(0.78_0.16_295)] grid place-items-center ring-1 ring-[oklch(0.68_0.18_295/0.3)]">
              <FolderKanban className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-[oklch(0.78_0.16_295)]" />
                Nouveau projet
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Définissez la portée, l'équipe et le calendrier du projet.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Fermer"
            className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 md:px-6 py-5 space-y-6">
            {/* Informations */}
            <Section title="Informations générales" icon={FileText}>
              <Field label="Nom du projet" required error={touched && errors.nom ? "Requis" : undefined}>
                <Input ref={firstInputRef} value={form.nom} onChange={(v) => set("nom", v)} placeholder="Ex : Refonte site Orchid Island" />
              </Field>
              <Field label="Description" required error={touched && errors.description ? "Minimum 5 caractères" : undefined}>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  placeholder="Objectifs, livrables attendus, contexte…"
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors resize-none"
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Client / Demandeur" icon={Building2}>
                  <Input value={form.client} onChange={(v) => set("client", v)} placeholder="Direction Marketing" hasIcon />
                </Field>
                <Field label="Département" icon={Building2}>
                  <Select value={form.departement} onChange={(v) => set("departement", v)} hasIcon>
                    <option value="">Sélectionner…</option>
                    {DEPARTEMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </Field>
              </div>
            </Section>

            {/* Priorité & Statut */}
            <Section title="Priorité & statut" icon={Flag}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="block text-[11px] font-medium text-foreground/80 mb-1.5">Priorité</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Basse", "Moyenne", "Haute"] as const).map((p) => {
                      const active = form.priorite === p;
                      const cls = active
                        ? p === "Haute" ? "bg-destructive/15 text-destructive ring-destructive/40"
                        : p === "Moyenne" ? "bg-warning/15 text-warning ring-warning/40"
                        : "bg-muted/60 text-foreground ring-border"
                        : "bg-background text-muted-foreground ring-border hover:text-foreground hover:bg-muted/40";
                      return (
                        <button key={p} type="button" onClick={() => set("priorite", p)}
                          className={`h-9 rounded-md text-xs font-medium ring-1 ring-inset transition-colors ${cls}`}>
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-foreground/80 mb-1.5">Statut initial</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["En cours", "En pause"] as Statut[]).map((s) => {
                      const active = form.statut === s;
                      const cls = active
                        ? s === "En cours" ? "bg-primary/15 text-primary ring-primary/40"
                        : "bg-muted/60 text-foreground ring-border"
                        : "bg-background text-muted-foreground ring-border hover:text-foreground hover:bg-muted/40";
                      return (
                        <button key={s} type="button" onClick={() => set("statut", s)}
                          className={`h-9 rounded-md text-xs font-medium ring-1 ring-inset transition-colors ${cls}`}>
                          {active && <Check className="inline h-3 w-3 mr-1 -mt-px" />}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Section>

            {/* Période */}
            <Section title="Calendrier" icon={Calendar}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Date de début" icon={Calendar}>
                  <Input type="date" value={form.dateDebut} onChange={(v) => set("dateDebut", v)} hasIcon />
                </Field>
                <Field label="Date d'échéance" icon={Calendar}
                  error={touched && errors.dateFin ? "Doit être après le début" : undefined}>
                  <Input type="date" value={form.dateFin} onChange={(v) => set("dateFin", v)} hasIcon />
                </Field>
              </div>
              {durationDays !== null && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-medium ring-1 ring-inset ring-primary/20">
                  <Activity className="h-3 w-3" />
                  Durée estimée : {durationDays} jour{durationDays > 1 ? "s" : ""}
                </div>
              )}
            </Section>

            {/* Équipe */}
            <Section title="Équipe assignée" icon={Users}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  value={stagSearch}
                  onChange={(e) => setStagSearch(e.target.value)}
                  placeholder="Rechercher un stagiaire…"
                  className="w-full h-9 pl-9 pr-3 rounded-md bg-background border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-background/40 divide-y divide-border">
                {filteredStag.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-muted-foreground">Aucun stagiaire trouvé</div>
                ) : filteredStag.map((s) => {
                  const checked = form.stagiaires.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleStag(s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${checked ? "bg-primary/5" : "hover:bg-muted/40"}`}
                    >
                      <div className={`h-7 w-7 rounded-full grid place-items-center text-[10px] font-semibold ${s.couleur}`}>
                        {s.initiale}
                      </div>
                      <span className="flex-1 text-sm text-foreground">{s.nom}</span>
                      <span className={`h-4 w-4 rounded grid place-items-center ring-1 ring-inset transition-colors ${checked ? "bg-primary text-primary-foreground ring-primary" : "bg-background ring-border"}`}>
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              {form.stagiaires.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {form.stagiaires.length} membre{form.stagiaires.length > 1 ? "s" : ""} sélectionné{form.stagiaires.length > 1 ? "s" : ""}
                </p>
              )}
            </Section>
          </div>

          {/* Footer */}
          <div className="px-5 md:px-6 py-3.5 border-t border-border bg-card/60 backdrop-blur sticky bottom-0 flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              L'équipe sera notifiée à la création du projet.
            </p>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleClose}
                className="h-9 px-4 rounded-md text-sm text-foreground bg-background border border-border hover:bg-muted/60 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Check className="h-4 w-4" />
                Créer le projet
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Section({
  title, icon: Icon, children,
}: { title: string; icon: typeof FileText; children: React.ReactNode }) {
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

function Field({
  label, required, error, icon: Icon, children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  icon?: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-[11px] font-medium text-foreground/80 mb-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </span>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        )}
        {children}
      </div>
      {error && (
        <span className="mt-1 flex items-center gap-1 text-[11px] text-destructive">
          <AlertCircle className="h-3 w-3" />
          {error}
        </span>
      )}
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

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { value, onChange, placeholder, type = "text", className = "", hasIcon },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-9 ${hasIcon ? "pl-9" : "pl-3"} pr-3 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors ${className}`}
    />
  );
});

function Select({
  value, onChange, children, hasIcon,
}: {
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
