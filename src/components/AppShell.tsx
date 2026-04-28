import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useMatch, useParams } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/cn";
import ImportExportMenu from "@/components/ImportExportMenu";
import HelpDialog from "@/components/HelpDialog";
import Icon from "@/components/Icon";

export default function AppShell() {
  const { id } = useParams();
  const isClassRoute = useMatch("/classes/:id/*");
  const klass = useAppStore((s) => (id ? s.classes.find((c) => c.id === id) : undefined));
  const [helpOpen, setHelpOpen] = useState(false);

  // Global undo / redo (works on every screen).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        useAppStore.temporal.getState().undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        useAppStore.temporal.getState().redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 shadow-topbar">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded px-1 text-sm font-semibold tracking-tight text-ink hover:text-primary"
            title="Back to all classes"
          >
            <Icon name="home" size={14} />
            <span className="hidden sm:inline">Seating Chart Designer</span>
          </Link>
          {isClassRoute && klass && (
            <>
              <span className="h-5 w-px bg-slate-300" aria-hidden />
              <h1 className="truncate text-base font-semibold text-ink" title={klass.name}>
                {klass.name}
              </h1>
              <nav className="ml-2 flex items-center gap-0.5 rounded-md bg-slate-100 p-0.5">
                <TabLink to={`/classes/${klass.id}/roster`}>Roster</TabLink>
                <TabLink to={`/classes/${klass.id}/room`}>Room</TabLink>
                <TabLink to={`/classes/${klass.id}/history`}>History</TabLink>
              </nav>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary"
            onClick={() => setHelpOpen(true)}
            title="Keyboard shortcuts"
          >
            <Icon name="help-circle" size={14} />
            <span className="hidden md:inline">Help</span>
          </button>
          <ImportExportMenu />
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <Outlet />
      </main>
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}

function TabLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "rounded px-2.5 py-1 text-xs font-medium transition",
          isActive ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink",
        )
      }
    >
      {children}
    </NavLink>
  );
}
