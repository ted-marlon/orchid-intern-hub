import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { login } from "@/lib/api/auth";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ShieldCheck, KeyRound, Lock } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — Orchid Island RH" },
      { name: "description", content: "Connectez-vous à votre espace de gestion Orchid Island." },
    ],
  }),
  component: LoginPage,
});

const gridStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M19 20H21M20 19V21' stroke='rgba(255,255,255,0.04)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "repeat" as const,
};

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateField = (name: "email" | "password", value: string) => {
    const newErrors = { ...errors };

    if (name === "email") {
      if (!value) {
        newErrors.email = "L'adresse email est requise.";
      } else if (!/\S+@\S+\.\S+/.test(value)) {
        newErrors.email = "Format d'adresse email invalide.";
      } else {
        delete newErrors.email;
      }
    }

    if (name === "password") {
      if (!value) {
        newErrors.password = "Le mot de passe est requis.";
      } else if (value.length < 4) {
        newErrors.password = "Le mot de passe doit comporter au moins 4 caractères.";
      } else {
        delete newErrors.password;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isEmailValid = validateField("email", email);
    const isPasswordValid = validateField("password", password);

    if (!isEmailValid || !isPasswordValid) {
      toast.error("Veuillez corriger les erreurs dans le formulaire.");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      toast.success("Connexion réussie !");
      router.navigate({ to: "/" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Une erreur s'est produite lors de la connexion.";
      if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
        toast.error("Impossible de joindre le serveur. Vérifiez que le backend Django est démarré.");
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info("Fonctionnalité indisponible pour le moment. Veuillez contacter votre administrateur.");
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background text-foreground overflow-hidden">
      {/* Colonne de gauche - Identité visuelle (visible sur desktop) */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 bg-gradient-to-b from-card via-card/70 to-[#0e1017] border-r border-border relative select-none">
        {/* Grille de fond */}
        <div className="absolute inset-0 pointer-events-none opacity-80" style={gridStyle} />

        {/* Logo et titre au centre vertical */}
        <div className="flex flex-col items-center justify-center flex-1 space-y-8 z-10">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105">
            <span className="text-white text-2xl font-bold tracking-wider">OI</span>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-serif font-semibold text-primary tracking-wide">Orchid Island</h1>
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">Real Estate — Plateforme RH</p>
          </div>
        </div>

        {/* Fonctionnalités en bas */}
        <div className="space-y-3 z-10 max-w-sm mx-auto w-full">
          {[
            { key: "U", title: "Gestion des Stagiaires", desc: "Fiches, candidatures, entretiens" },
            { key: "D", title: "Tableau de Bord", desc: "KPI temps réel & alertes" },
            { key: "Q", title: "Pointage QR Code", desc: "Entrée / Sortie + alertes WhatsApp" },
            { key: "R", title: "Rapports Automatiques", desc: "Journalier & rapport final de stage" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-4 p-3.5 rounded-xl border border-border/40 bg-[#161a23]/35 backdrop-blur-md transition-all duration-300 hover:border-primary/20 hover:bg-[#161a23]/60 group"
            >
              <div className="h-9 w-9 rounded-lg bg-[#1a202d] border border-border/60 flex items-center justify-center text-primary font-semibold text-sm group-hover:border-primary/30 transition-colors">
                {item.key}
              </div>
              <div className="leading-tight">
                <h4 className="text-xs font-semibold text-foreground/90">{item.title}</h4>
                <p className="text-[10px] text-muted-foreground/80 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Colonne de droite - Formulaire de connexion */}
      <div className="col-span-1 lg:col-span-7 flex flex-col justify-between items-center p-8 lg:p-16 h-full min-h-screen relative bg-[#090a0f]">
        <div className="w-full max-w-[400px] my-auto space-y-8 z-10">
          {/* En-tête de bienvenue */}
          <div className="space-y-2">
            <h2 className="text-3xl font-serif font-medium tracking-tight text-white">Bienvenue</h2>
            <p className="text-xs text-muted-foreground">Connectez-vous à votre espace de gestion</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Adresse Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) validateField("email", e.target.value);
                }}
                onBlur={() => validateField("email", email)}
                className={`w-full h-11 px-3.5 rounded-lg bg-[#121620]/40 border text-sm transition-all focus:outline-none focus:ring-1 ${
                  errors.email
                    ? "border-destructive focus:ring-destructive focus:border-destructive"
                    : "border-border/60 focus:ring-primary focus:border-primary"
                }`}
                disabled={loading}
                required
              />
              {errors.email && (
                <p className="text-[11px] text-destructive mt-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="h-1 w-1 rounded-full bg-destructive inline-block" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Mot de Passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) validateField("password", e.target.value);
                  }}
                  onBlur={() => validateField("password", password)}
                  className={`w-full h-11 pl-3.5 pr-10 rounded-lg bg-[#121620]/40 border text-sm transition-all focus:outline-none focus:ring-1 ${
                    errors.password
                      ? "border-destructive focus:ring-destructive focus:border-destructive"
                      : "border-border/60 focus:ring-primary focus:border-primary"
                  }`}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-destructive mt-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <span className="h-1 w-1 rounded-full bg-destructive inline-block" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Mot de passe oublié */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-primary hover:text-primary/80 transition-colors font-medium hover:underline cursor-pointer"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Bouton Connexion */}
            <button
              type="submit"
              disabled={loading || !!errors.email || !!errors.password}
              className="w-full h-11 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>

        {/* Pied de page technique */}
        <div className="flex items-center justify-center gap-6 pt-6 text-[10px] text-muted-foreground/50 font-mono tracking-wider select-none z-10 w-full">
          <span className="flex items-center gap-1.5 transition-colors hover:text-muted-foreground/80">
            <ShieldCheck className="h-3.5 w-3.5 text-primary/40" />
            JWT Sécurisé
          </span>
          <span className="flex items-center gap-1.5 transition-colors hover:text-muted-foreground/80">
            <KeyRound className="h-3.5 w-3.5 text-primary/40" />
            RBAC
          </span>
          <span className="flex items-center gap-1.5 transition-colors hover:text-muted-foreground/80">
            <Lock className="h-3.5 w-3.5 text-primary/40" />
            bcrypt
          </span>
        </div>
      </div>
    </div>
  );
}
