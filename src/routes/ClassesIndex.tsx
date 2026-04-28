import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/appStore";

export default function ClassesIndex() {
  const navigate = useNavigate();
  const classes = useAppStore((s) => s.classes);
  const createClass = useAppStore((s) => s.createClass);
  const renameClass = useAppStore((s) => s.renameClass);
  const deleteClass = useAppStore((s) => s.deleteClass);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const id = createClass(name);
    setNewName("");
    navigate(`/classes/${id}/roster`);
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Your classes</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Each class has its own roster, room layout, and seating history.
      </p>

      <div className="card mb-8 p-4">
        <label className="label mb-2">Add a new class</label>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="e.g. Period 3 Math"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button className="btn-primary" onClick={handleCreate}>Create</button>
        </div>
      </div>

      {classes.length === 0 ? (
        <div className="card p-8 text-center text-ink-muted">No classes yet — add one above.</div>
      ) : (
        <ul className="space-y-2">
          {classes.map((c) => (
            <li key={c.id} className="card flex items-center justify-between p-4">
              {editingId === c.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    className="input"
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        renameClass(c.id, editValue.trim() || c.name);
                        setEditingId(null);
                      } else if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      renameClass(c.id, editValue.trim() || c.name);
                      setEditingId(null);
                    }}
                  >
                    Save
                  </button>
                  <button className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="text-base font-medium">{c.name}</div>
                    <div className="text-xs text-ink-muted">
                      {c.students.length} students · {c.room.desks.length} desks · {c.arrangements.length} saved arrangements
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/classes/${c.id}/roster`} className="btn-secondary">Roster</Link>
                    <Link to={`/classes/${c.id}/room`} className="btn-primary">Open room</Link>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditValue(c.name);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => {
                        if (confirm(`Delete "${c.name}"? This cannot be undone.`)) deleteClass(c.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
