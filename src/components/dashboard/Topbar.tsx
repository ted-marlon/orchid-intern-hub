import { Bell, Search } from "lucide-react";

export function Topbar({ title }: { title: string }) {
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 px-3 h-8 rounded-md border border-border bg-muted/30 text-xs text-muted-foreground w-64">
          <Search className="h-3.5 w-3.5" />
          <input
            placeholder="Rechercher…"
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-background/60">⌘K</kbd>
        </div>
        <span className="text-xs text-muted-foreground hidden lg:inline tabular-nums">{today}</span>
        <button className="relative h-8 w-8 grid place-items-center rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  );
}
