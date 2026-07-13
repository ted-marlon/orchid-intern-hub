import { useState, useEffect } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { getAuthToken, getApiUrl } from "@/lib/api/auth";

type PresenceAPI = {
  id: number;
  date: string;
  statut: string;
  stagiaire: number;
};

type ChartData = {
  d: string;
  v: number;
};

export function AttendanceChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"month" | "30days">("30days");

    useEffect(() => {
    const fetchPresences = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(getApiUrl('/api/presences/'), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const presencesData = await res.json();
          const presences: PresenceAPI[] = Array.isArray(presencesData) 
            ? presencesData 
            : presencesData.results || [];

          // 1. Déterminer les dates de début et de fin en heure LOCALE
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          
          let startDate: Date;
          if (period === "month") {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          } else {
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 29);
          }
          startDate.setHours(0, 0, 0, 0);

          // 2. CORRECTION : Convertir en chaînes "YYYY-MM-DD" locales pour éviter le bug UTC
          const formatDateLocal = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };

          const startDateStr = formatDateLocal(startDate);
          const todayStr = formatDateLocal(today);

          // 3. Filtrer les présences (la comparaison de chaînes "YYYY-MM-DD" est fiable et rapide)
          const filteredPresences = presences.filter((p) => {
            return p.date >= startDateStr && p.date <= todayStr && p.statut === 'present';
          });

          // 4. Grouper par jour et compter
          const groupedByDate = new Map<string, number>();
          filteredPresences.forEach((p) => {
            const count = groupedByDate.get(p.date) || 0;
            groupedByDate.set(p.date, count + 1);
          });

          // 5. Créer le tableau pour le graphique
          const chartData: ChartData[] = [];
          const currentDate = new Date(startDate);

          while (currentDate <= today) {
            // On génère la chaîne de date en heure LOCALE (pas d'toISOString)
            const dateStr = formatDateLocal(currentDate);
            const count = groupedByDate.get(dateStr) || 0;
            
            // Le jour à afficher sur l'axe X
            const dayFormatted = String(currentDate.getDate()).padStart(2, '0');
            
            chartData.push({
              d: dayFormatted,
              v: count,
            });

            // Passer au jour suivant
            currentDate.setDate(currentDate.getDate() + 1);
          }

          setData(chartData);
        } else {
          console.error('Erreur chargement présences:', res.status);
        }
      } catch (err) {
        console.error('Erreur fetch présences:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPresences();
  }, [period]);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Présences mensuelles</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? "Chargement..." : `Évolution sur ${period === "month" ? "le mois en cours" : "30 jours"}`}
          </p>
        </div>
        <select 
          value={period}
          onChange={(e) => setPeriod(e.target.value as "month" | "30days")}
          className="text-xs bg-muted/40 border border-border rounded-md px-2 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="month">Ce mois</option>
          <option value="30days">30 derniers jours</option>
        </select>
      </div>
      <div className="h-56">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-muted-foreground">Chargement...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-muted-foreground">Aucune donnée disponible</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="att" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.68 0.16 245)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="oklch(0.68 0.16 245)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.27 0.013 250)" strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="d" 
                tick={{ fill: "oklch(0.6 0.018 250)", fontSize: 11 }} 
                axisLine={false} 
                tickLine={false} 
                interval={period === "30days" ? 4 : 2}
              />
              <YAxis 
                tick={{ fill: "oklch(0.6 0.018 250)", fontSize: 11 }} 
                axisLine={false} 
                tickLine={false} 
                width={32} 
              />
              <Tooltip
  contentStyle={{
    background: "oklch(0.205 0.014 250)",
    border: "1px solid oklch(0.27 0.013 250)",
    borderRadius: 8,
    fontSize: 12,
    color: "oklch(0.97 0.005 240)",
  }}
  cursor={{ stroke: "oklch(0.68 0.16 245)", strokeWidth: 1, strokeDasharray: "3 3" }}
  formatter={(value: any) => [`${value} présence${Number(value) > 1 ? 's' : ''}`, 'Total']}
/>
              <Area
                type="monotone"
                dataKey="v"
                stroke="oklch(0.68 0.16 245)"
                strokeWidth={2}
                fill="url(#att)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
