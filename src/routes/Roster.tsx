import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import PasteNamesDialog from "@/components/roster/PasteNamesDialog";
import KeepApartEditor from "@/components/roster/KeepApartEditor";

type View = "list" | "matrix";

export default function Roster() {
  const { id } = useParams();
  const klass = useAppStore((s) => (id ? s.classes.find((c) => c.id === id) : undefined));
  const updateStudent = useAppStore((s) => s.updateStudent);
  const removeStudent = useAppStore((s) => s.removeStudent);

  const [pasteOpen, setPasteOpen] = useState(false);
  const [view, setView] = useState<View>("list");

  if (!klass) return <div className="p-6 text-ink-muted">Class not found.</div>;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Roster · {klass.name}</h1>
          <p className="text-sm text-ink-muted">{klass.students.length} students</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-slate-200 p-0.5">
            <button
              className={view === "list" ? "btn-primary" : "btn-secondary"}
              onClick={() => setView("list")}
            >
              List
            </button>
            <button
              className={view === "matrix" ? "btn-primary" : "btn-secondary"}
              onClick={() => setView("matrix")}
            >
              Keep Apart matrix
            </button>
          </div>
          <button className="btn-primary" onClick={() => setPasteOpen(true)}>Paste names</button>
        </div>
      </div>

      {view === "list" ? (
        <div className="card">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Front row</th>
                <th className="px-4 py-2">Keep apart from</th>
                <th className="px-4 py-2 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {klass.students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                    No students yet — paste a list to get started.
                  </td>
                </tr>
              ) : (
                klass.students.map((st) => (
                  <tr key={st.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">
                      <input
                        className="input"
                        value={st.name}
                        onChange={(e) => updateStudent(klass.id, st.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={st.needsFrontRow}
                          onChange={(e) => updateStudent(klass.id, st.id, { needsFrontRow: e.target.checked })}
                        />
                        <span className="text-sm">Needs front row</span>
                      </label>
                    </td>
                    <td className="px-4 py-2">
                      <KeepApartEditor classId={klass.id} student={st} students={klass.students} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          if (confirm(`Remove ${st.name}?`)) removeStudent(klass.id, st.id);
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <KeepApartMatrix classId={klass.id} />
      )}

      <PasteNamesDialog open={pasteOpen} onOpenChange={setPasteOpen} classId={klass.id} />
    </div>
  );
}

function KeepApartMatrix({ classId }: { classId: string }) {
  const klass = useAppStore((s) => s.classes.find((c) => c.id === classId));
  const toggleKeepApart = useAppStore((s) => s.toggleKeepApart);
  if (!klass) return null;
  const { students } = klass;

  if (students.length < 2) {
    return <div className="card p-6 text-center text-ink-muted">Add at least two students to use the matrix.</div>;
  }

  return (
    <div className="card overflow-auto">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white px-2 py-2"></th>
            {students.map((s) => (
              <th key={s.id} className="px-2 py-2 text-left whitespace-nowrap">
                <span className="block w-24 truncate" title={s.name}>{s.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((row) => (
            <tr key={row.id}>
              <th className="sticky left-0 z-10 bg-white px-2 py-1 text-left whitespace-nowrap">
                <span className="block w-32 truncate" title={row.name}>{row.name}</span>
              </th>
              {students.map((col) => {
                if (row.id === col.id) return <td key={col.id} className="bg-slate-100 px-2 py-1"></td>;
                const checked = row.keepApart.includes(col.id);
                return (
                  <td key={col.id} className="px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleKeepApart(classId, row.id, col.id)}
                      title={`Keep ${row.name} apart from ${col.name}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
