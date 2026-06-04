import { forwardRef, useEffect, useRef, useState } from "react";
import {
  X, ClipboardList, FileText, Users, FolderKanban, Calendar, Flag,
  Check, AlertCircle, Search, Tag, Clock,
} from "lucide-react";

type Statut = "À faire" | "En cours" | "En revue" | "Terminée";
type Priorite = "Haute" | "Moyenne" | "Basse";

type Stagiaire = { id: string; nom: string; initiale: string; couleur: string };
type Projet = { id: string; nom: string; couleur: string };

type Props = {
  open: boolean;
  onClose: () => void;
  projets: Projet[];
  stagiaires: Stagiaire[];
  onSubmit?: (data: FormState) => void;
};

export type FormState = {
  titre: string;
  description: string;
  projetId: string;
  statut: Statut;
  priorite: Priorite;
  echeance: string;
  estimation: string; // heures
  assignes: string[];
  tags: string[];
};

const EMPTY: FormState = {
  titre: "", description: "", projetId: "",
  statut: "À faire", priorite: "Moyenne",
  echeance: "", estimation: "",
  assignes: [], tags: [],
};

export function NewTacheDialog({ open, onClose, projets, stagiaires, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [stagSearch, setStagSearch] = useState("");
  const [tagInput, setTagInput] = useState("");
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
    titre: !form.titre.trim(),
    projet: !form.projetId,
    description: form.description.trim().length > 0 && form.description.trim().length < 5,
  };
  const isValid = !errors.titre && !errors.projet && !errors.description;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit?.(form);
    reset();
    onClose();
  }

  function reset() {
    setForm(EMPTY);
    setTouched(false);
    setStagSearch("");
    setTagInput("");
  }

  function handleClose() { reset(); onClose(); }

  function toggleStag(id: string) {
    set("assignes", form.assignes.includes(id)
      ? form.assignes.filter((x) => x !== id)
      : [...form.assignes, id]);
  }

  function addTag(raw: string) {
    const t = raw.trim().replace(/^#/, "");
    if (!t) return;
    if (form.tags.includes(t)) { setTagInput(""); return; }
    set("tags", [...form.tags, t]);
    setTagInput("");
  }
  function removeTag(t: string) {
    set("tags", form.tags.filter((x) => x !== t));
  }

  const filteredStag = stagiaires.filter((s) =>
    !stagSearch || s.nom.toLowerCase().includes(stagSearch.toLowerCase()),
  );

  const days = (() => {
    if (!form.echeance) return null;
    const d = (new Date(form.echeance).getTime() - Date.now()) / 86400000;
    return Math.ceil(d);
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
            <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/30">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <h2 className="text-base font-semibold text-foreground">Nouvelle tâche</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Décrivez la tâche, son projet, sa priorité et les stagiaires assignés.
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
            <Section title="Informations" icon={FileText}>
              <Field label="Titre de la tâche" required error={touched && errors.titre ? "Requis" : undefined}>
                <Input ref={firstInputRef} value={form.titre} onChange={(v) => set("titre", v)} placeholder="Ex : Wireframes page d'accueil" />
              </Field>
              <Field label="Description" error={touched && errors.description ? "Minimum 5 caractères" : undefined}>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  placeholder="Contexte, livrables, critères d'acceptation…"
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors resize-none"
                />
              </Field>
              <Field label="Projet" required icon={FolderKanban} error={touched && errors.projet ? "Sélectionnez un projet" : undefined}>
                <Select value={form.projetId} onChange={(v) => set("projetId", v)} hasIcon>
                  <option value="">Sélectionner un projet…</option>
                  {projets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                </Select>
              </Field>
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
                  <div className="grid grid-cols-3 gap-2">
                    {(["À faire", "En cours", "En revue"] as Statut[]).map((s) => {
                      const active = form.statut === s;
                      const cls = active
                        ? s === "En cours" ? "bg-primary/15 text-primary ring-primary/40"
                        : s === "En revue" ? "bg-warning/15 text-warning ring-warning/40"
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

            {/* Planning */}
            <Section title="Planning" icon={Calendar}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Échéance" icon={Calendar}>
                  <Input type="date" value={form.echeance} onChange={(v) => set("echeance", v)} hasIcon />
                </Field>
                <Field label="Estimation (heures)" icon={Clock}>
                  <Input type="number" value={form.estimation} onChange={(v) => set("estimation", v)} placeholder="Ex : 8" hasIcon />
                </Field>
              </div>
              {days !== null && (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium ring-1 ring-inset ${
                  days < 0 ? "bg-destructive/10 text-destructive ring-destructive/25"
                  : days <= 3 ? "bg-warning/10 text-warning ring-warning/25"
                  : "bg-primary/10 text-primary ring-primary/20"
                }`}>
                  <Clock className="h-3 w-3" />
                  {days < 0 ? `En retard de ${Math.abs(days)} jour${Math.abs(days) > 1 ? "s" : ""}`
                    : days === 0 ? "Échéance aujourd'hui"
                    : `Dans ${days} jour${days > 1 ? "s" : ""}`}
                </div>
              )}
            </Section>

            {/* Tags */}
            <Section title="Étiquettes" icon={Tag}>
              <div className="flex flex-wrap items-center gap-1.5">
                {form.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-md bg-muted/60 text-foreground text-[11px] ring-1 ring-inset ring-border">
                    #{t}
                    <button type="button" onClick={() => removeTag(t)} className="h-4 w-4 grid place-items-center rounded hover:bg-background text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <div className="relative flex-1 min-w-[160px]">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
                      else if (e.key === "Backspace" && !tagInput && form.tags.length) {
                        removeTag(form.tags[form.tags.length - 1]);
                      }
                    }}
                    onBlur={() => tagInput && addTag(tagInput)}
                    placeholder="Ajouter un tag puis Entrée…"
                    className="w-full h-9 pl-9 pr-3 rounded-md bg-background border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            </Section>

            {/* Assignés */}
            <Section title="Stagiaires assignés" icon={Users}>
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
                  const checked = form.assignes.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleStag(s.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${checked ? "bg-primary/5" : "hover:bg-muted/40"}`}
                    >
                      <div className={`h-7 w-7 rounded-full grid place-items-center text-[10px] font-semibold ring-1 ring-inset ${s.couleur}`}>
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
              {form.assignes.length > 0 && (
                <p className="text-[11px] text-muted-foreground">
                  {form.assignes.length} stagiaire{form.assignes.length > 1 ? "s" : ""} assigné{form.assignes.length > 1 ? "s" : ""}
                </p>
              )}
            </Section>
          </div>

          {/* Footer */}
          <div className="px-5 md:px-6 py-3.5 border-t border-border bg-card/60 backdrop-blur sticky bottom-0 flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Les stagiaires assignés seront notifiés.
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
                Créer la tâche
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
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
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
      className={`w-full h-9 ${hasIcon ? "pl-9" : "pl-3"} pr-3 rounded-md bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors appearance-none cursor-pointer`}
    >
      {children}
    </select>
  );
}
