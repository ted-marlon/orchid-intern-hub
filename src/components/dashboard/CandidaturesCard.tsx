import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getAuthToken, getApiUrl } from "@/lib/api/auth";

type StagiaireAPI = {
  id: number;
  date_debut: string;
  date_fin: string;
};

export function CandidaturesCard() {
  const [actifs, setActifs] = useState(0);
  const [termines, setTermines] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStagiaires = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(getApiUrl('/api/stagiaires/'), {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const stagiaires: StagiaireAPI[] = Array.isArray(data) ? data : data.results || [];
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let countActifs = 0;
          let countTermines = 0;
          
          stagiaires.forEach((s) => {
            const dateFin = new Date(s.date_fin);
            dateFin.setHours(0, 0, 0, 0);
            
            if (dateFin >= today) {
              countActifs++;
            } else {
              countTermines++;
            }
          });
          
          setActifs(countActifs);
          setTermines(countTermines);
        } else {
          console.error('Erreur chargement stagiaires:', res.status);
        }
      } catch (err) {
        console.error('Erreur fetch stagiaires:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStagiaires();
  }, []);

  const total = actifs + termines;
  
  const data = [
    { name: "Actifs", value: actifs, color: "oklch(0.72 0.16 155)" },
    { name: "Terminés", value: termines, color: "oklch(0.63 0.21 22)" },
  ];

  const display = total === 0 ? [{ name: "—", value: 1, color: "oklch(0.27 0.013 250)" }] : data;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Stagiaires</h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {loading ? "..." : `Total: ${total}`}
        </span>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={display}
                innerRadius={42}
                outerRadius={58}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {display.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-xl font-semibold tabular-nums">
                {loading ? "..." : total}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</div>
            </div>
          </div>
        </div>
        <ul className="flex-1 space-y-2.5">
          {data.map((d) => (
            <li key={d.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-foreground/90">{d.name}</span>
              </span>
              <span className="text-muted-foreground tabular-nums text-xs">
                {loading ? "..." : d.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
