import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import PasteNamesDialog from "@/components/roster/PasteNamesDialog";
import KeepApartEditor from "@/components/roster/KeepApartEditor";

export default function Roster() {
  const { id } = useParams();
  const klass = useAppStore((s) => (id ? s.classes.find((c) => c.id === id) : undefined));
  const updateStudent = useAppStore((s) => s.updateStudent);
  const removeStudent = useAppStore((s) => s.removeStudent);

  const [pasteOpen, setPasteOpen] = useState(false);

  if (!klass) return <div className="p-6 text-ink-muted">Class not found.</div>;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Roster · {klass.name}</h1>
          <p className="text-sm text-ink-muted">{klass.students.length} students</p>
        </div>
        <button className="btn-primary" onClick={() => setPasteOpen(true)}>Paste names</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[42%]" />
            <col className="w-[18%]" />
            <col className="w-[28%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Front row</th>
              <th className="px-4 py-2">Keep apart from</th>
              <th className="px-4 py-2"></th>
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
                        onChange={(e) =>
                          updateStudent(klass.id, st.id, { needsFrontRow: e.target.checked })
                        }
                      />
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

      <PasteNamesDialog open={pasteOpen} onOpenChange={setPasteOpen} classId={klass.id} />
    </div>
  );
}
