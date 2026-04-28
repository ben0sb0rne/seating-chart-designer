import { Link, NavLink, Outlet, useMatch, useParams } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/cn";
import ImportExportMenu from "@/components/ImportExportMenu";

export default function AppShell() {
  const { id } = useParams();
  const isClassRoute = useMatch("/classes/:id/*");
  const klass = useAppStore((s) => (id ? s.classes.find((c) => c.id === id) : undefined));

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-base font-semibold tracking-tight">
            Seating Chart Designer
          </Link>
          {isClassRoute && klass && (
            <nav className="flex items-center gap-1">
              <span className="mr-2 text-sm text-ink-muted">{klass.name}</span>
              <TabLink to={`/classes/${klass.id}/roster`}>Roster</TabLink>
              <TabLink to={`/classes/${klass.id}/room`}>Room</TabLink>
              <TabLink to={`/classes/${klass.id}/history`}>History</TabLink>
            </nav>
          )}
        </div>
        <ImportExportMenu />
      </header>
      <main className="min-h-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function TabLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "rounded-md px-3 py-1.5 text-sm font-medium transition",
          isActive ? "bg-ink text-white" : "text-ink-muted hover:bg-slate-100",
        )
      }
    >
      {children}
    </NavLink>
  );
}
