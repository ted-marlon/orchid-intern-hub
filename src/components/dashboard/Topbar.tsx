import { Bell, PanelLeftClose, PanelLeftOpen } from "lucide-react";

export function Topbar({
  title,
  sidebarOpen = true,
  onToggleSidebar,
}: {
  title: string;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}) {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Réduire le menu" : "Ouvrir le menu"}
          className="h-8 w-8 grid place-items-center rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </button>
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground hidden lg:inline tabular-nums">{today}</span>
        <button className="relative h-8 w-8 grid place-items-center rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  );
}
