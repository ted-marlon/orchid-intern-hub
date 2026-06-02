import { useEffect, useRef, useState } from "react";
import {
  X, User, Mail, Lock, Phone, GraduationCap, Briefcase, Building2,
  Calendar, BadgeCheck, Eye, EyeOff, Check, AlertCircle,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: FormState) => void;
};

type FormState = {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  telephone: string;
  ecole: string;
  formation: string;
  departement: string;
  dateDebut: string;
  dateFin: string;
  statut: "En attente" | "Accepté" | "Refusé";
};

const EMPTY: FormState = {
  prenom: "", nom: "", email: "", password: "",
  telephone: "", ecole: "", formation: "", departement: "",
  dateDebut: "", dateFin: "", statut: "En attente",
};

const DEPARTEMENTS = ["Marketing", "IT", "RH", "Ventes", "Comptabilité", "Projets"];

export function NewStagiaireDialog({ open, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [showPwd, setShowPwd] = useState(false);
  const [touched, setTouched] = useState(false);
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
    prenom: !form.prenom.trim(),
    nom: !form.nom.trim(),
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
    password: form.password.length < 6,
  };
  const isValid = !Object.values(errors).some(Boolean);

  const pwdScore = scorePassword(form.password);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit?.(form);
    setForm(EMPTY);
    setTouched(false);
    onClose();
  }

  function handleClose() {
    setForm(EMPTY);
    setTouched(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <button
        aria-label="Fermer"
        onClick={handleClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-in fade-in"
      />

      {/* Panel */}
      <div className="relative w-full md:max-w-2xl max-h-[92vh] flex flex-col rounded-t-2xl md:rounded-2xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom-4 md:zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between px-5 md:px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary grid place-items-center ring-1 ring-primary/25">
              <User className="h-4.5 w-4.5" />
            </div>
            <div className="leading-tight">
              <h2 className="text-base font-semibold text-foreground">Nouveau stagiaire</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Créez un compte et renseignez les informations du stage.
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
            {/* Identité */}
            <Section title="Identité" icon={User}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Prénom" required error={touched && errors.prenom ? "Requis" : undefined}>
                  <Input ref={firstInputRef} value={form.prenom} onChange={(v) => set("prenom", v)} placeholder="Mohamed" />
                </Field>
                <Field label="Nom" required error={touched && errors.nom ? "Requis" : undefined}>
                  <Input value={form.nom} onChange={(v) => set("nom", v)} placeholder="Alami" />
                </Field>
              </div>
            </Section>

            {/* Compte */}
            <Section title="Compte d'accès" icon={Lock}>
              <Field label="Email" required error={touched && errors.email ? "Email invalide" : undefined} icon={Mail}>
                <Input type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="m.alami@orchidisland.immo" hasIcon />
              </Field>
              <Field label="Mot de passe" required error={touched && errors.password ? "Minimum 6 caractères" : undefined} icon={Lock}>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(v) => set("password", v)}
                    placeholder="Min. 6 caractères"
                    hasIcon
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-6 w-6 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    aria-label={showPwd ? "Masquer" : "Afficher"}
                  >
                    {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                {form.password.length > 0 && <PasswordStrength score={pwdScore} />}
              </Field>
            </Section>

            {/* Contact & école */}
            <Section title="Contact & formation" icon={GraduationCap}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Téléphone WhatsApp" icon={Phone}>
                  <Input value={form.telephone} onChange={(v) => set("telephone", v)} placeholder="+212 6XX XXX XXX" hasIcon />
                </Field>
                <Field label="École" icon={GraduationCap}>
                  <Input value={form.ecole} onChange={(v) => set("ecole", v)} placeholder="ENSA Marrakech" hasIcon />
                </Field>
                <Field label="Filière / Formation" icon={Briefcase}>
                  <Input value={form.formation} onChange={(v) => set("formation", v)} placeholder="Génie informatique" hasIcon />
                </Field>
                <Field label="Département" icon={Building2}>
                  <Select value={form.departement} onChange={(v) => set("departement", v)} hasIcon>
                    <option value="">Sélectionner…</option>
                    {DEPARTEMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </Field>
              </div>
            </Section>

            {/* Stage */}
            <Section title="Période de stage" icon={Calendar}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Date début" icon={Calendar}>
                  <Input type="date" value={form.dateDebut} onChange={(v) => set("dateDebut", v)} hasIcon />
                </Field>
                <Field label="Date fin" icon={Calendar}>
                  <Input type="date" value={form.dateFin} onChange={(v) => set("dateFin", v)} hasIcon />
                </Field>
              </div>
            </Section>

            {/* Statut */}
            <Section title="Statut de candidature" icon={BadgeCheck}>
              <div className="grid grid-cols-3 gap-2">
                {(["En attente", "Accepté", "Refusé"] as const).map((s) => {
                  const active = form.statut === s;
                  const tone =
                    s === "Accepté" ? "success" :
                    s === "Refusé" ? "destructive" : "warning";
                  const cls = active
                    ? tone === "success" ? "bg-success/15 text-success ring-success/40"
                    : tone === "destructive" ? "bg-destructive/15 text-destructive ring-destructive/40"
                    : "bg-warning/15 text-warning ring-warning/40"
                    : "bg-background text-muted-foreground ring-border hover:text-foreground hover:bg-muted/40";
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("statut", s)}
                      className={`h-9 rounded-md text-xs font-medium ring-1 ring-inset transition-colors ${cls}`}
                    >
                      {active && <Check className="inline h-3 w-3 mr-1 -mt-px" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </Section>
          </div>

          {/* Footer */}
          <div className="px-5 md:px-6 py-3.5 border-t border-border bg-card/60 backdrop-blur sticky bottom-0 flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Un email d'invitation sera envoyé au stagiaire.
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
                className="h-9 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 transition-colors"
              >
                <Check className="h-4 w-4" />
                Enregistrer
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
}: { title: string; icon: typeof User; children: React.ReactNode }) {
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
  icon?: typeof User;
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

const Input = (() => {
  const Cmp = (
    {
      value, onChange, placeholder, type = "text", className = "", hasIcon,
    }: {
      value: string;
      onChange: (v: string) => void;
      placeholder?: string;
      type?: string;
      className?: string;
      hasIcon?: boolean;
    },
    ref: React.Ref<HTMLInputElement>,
  ) => (
    <input
      ref={ref}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full h-9 ${hasIcon ? "pl-9" : "pl-3"} pr-3 rounded-md bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors ${className}`}
    />
  );
  return Object.assign(
    // eslint-disable-next-line react/display-name
    require("react").forwardRef(Cmp) as React.ForwardRefExoticComponent<
      Parameters<typeof Cmp>[0] & React.RefAttributes<HTMLInputElement>
    >,
    {},
  );
})();

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

function scorePassword(p: string) {
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 10) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  return s; // 0..4
}

function PasswordStrength({ score }: { score: number }) {
  const labels = ["Très faible", "Faible", "Moyen", "Bon", "Excellent"];
  const colors = ["bg-destructive", "bg-destructive", "bg-warning", "bg-primary", "bg-success"];
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="flex-1 flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-muted"}`}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums w-16 text-right">{labels[score]}</span>
    </div>
  );
}
