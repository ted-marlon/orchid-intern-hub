import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { QrCode, CheckCircle2, XCircle, AlertTriangle, RefreshCw, LogIn, LogOut, ShieldAlert } from "lucide-react";
import { getAuthToken, getApiUrl } from "@/lib/api/auth";

export const Route = createFileRoute("/scan-qr")({
  head: () => ({
    meta: [
      { title: "Scanner QR — Orchid Island RH" },
      { name: "description", content: "Scanner le QR code pour pointer votre présence." },
    ],
  }),
  component: ScanQrPage,
});

type QRResponse = {
  entree: string;
  sortie: string;
  entree_data: string;
  sortie_data: string;
  date: string;
};

function ScanQrPage() {
  const router = useRouter();
  const [qrData, setQrData] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; type?: string; heure?: string } | null>(null);
  const [qrCodes, setQrCodes] = useState<QRResponse | null>(null);
  const [selectedType, setSelectedType] = useState<"entree" | "sortie">("entree");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = getAuthToken();
      if (!token) {
        router.navigate({ to: "/login" });
        return;
      }

      try {
        const response = await fetch(getApiUrl("/api/users/me/"), {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
          if (data.role !== 'stagiaire') {
            router.navigate({ to: "/" });
            return;
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

  useEffect(() => {
    const fetchQRCodes = async () => {
      const token = getAuthToken();
      try {
        const response = await fetch(getApiUrl("/api/presences/get-daily-qrs/"), {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setQrCodes(data);
        }
      } catch (err) {
        console.error("Error fetching QR codes:", err);
      }
    };
    
    if (userRole === 'stagiaire') {
      fetchQRCodes();
    }
  }, [userRole]);

  if (userRole === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (userRole !== 'stagiaire') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Accès refusé</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Cette page est réservée aux stagiaires uniquement.
          </p>
          <button
            onClick={() => router.navigate({ to: "/" })}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const handleScan = async (type: "entree" | "sortie") => {
    if (!qrCodes || loading) return;
    
    setLoading(true);
    setResult(null);
    setSelectedType(type);
    
    const token = getAuthToken();
    const qrDataToUse = type === "entree" ? qrCodes.entree_data : qrCodes.sortie_data;
    
    try {
      const response = await fetch(getApiUrl("/api/presences/scanner/"), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ qr_data: qrDataToUse }),
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        setResult({
          success: true,
          message: responseData.message || "Pointage enregistré avec succès",
          type: responseData.type,
          heure: responseData.heure,
        });
      } else {
        setResult({
          success: false,
          message: responseData.error || responseData.detail || "Erreur lors du pointage",
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: "Erreur de connexion au serveur",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">Pointage QR</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Enregistrez votre présence en scannant le QR code
        </p>
      </div>

      <div className="flex-1 p-4 flex flex-col items-center justify-center gap-6">
        {/* QR Codes Display */}
        <div className="w-full max-w-md">
          <p className="text-sm font-medium text-foreground mb-3 text-center">
            QR Codes du jour
          </p>
          
          {qrCodes ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Entrée QR */}
              <button
                onClick={() => handleScan("entree")}
                disabled={loading}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="h-24 w-24 rounded-md bg-white p-2">
                  <img 
                    src={qrCodes.entree.startsWith("data:") ? qrCodes.entree : `data:image/png;base64,${qrCodes.entree}`}
                    alt="QR Entrée"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-success">
                  <LogIn className="h-4 w-4" />
                  Entrée
                </div>
              </button>

              {/* Sortie QR */}
              <button
                onClick={() => handleScan("sortie")}
                disabled={loading}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-card hover:bg-muted/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="h-24 w-24 rounded-md bg-white p-2">
                  <img 
                    src={qrCodes.sortie.startsWith("data:") ? qrCodes.sortie : `data:image/png;base64,${qrCodes.sortie}`}
                    alt="QR Sortie"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-violet-400">
                  <LogOut className="h-4 w-4" />
                  Sortie
                </div>
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Chargement des QR codes...</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="w-full max-w-md p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Cliquez sur le QR code correspondant à votre action (Entrée ou Sortie) pour enregistrer votre pointage.
              Assurez-vous d'être connecté avec votre compte stagiaire.
            </p>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className={`w-full max-w-md p-4 rounded-lg border ${
            result.success 
              ? "bg-success/10 border-success/30 text-success" 
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{result.message}</p>
                {result.type && result.heure && (
                  <p className="text-xs mt-1 opacity-80">
                    {result.type === 'entree' ? 'Entrée' : 'Sortie'} à {result.heure}
                  </p>
                )}
              </div>
              <button
                onClick={() => setResult(null)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
