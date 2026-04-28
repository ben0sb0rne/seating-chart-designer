import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import Icon from "@/components/Icon";

export default function ClassesIndex() {
  const navigate = useNavigate();
  const classes = useAppStore((s) => s.classes);
  const createClass = useAppStore((s) => s.createClass);
  const renameClass = useAppStore((s) => s.renameClass);
  const duplicateClass = useAppStore((s) => s.duplicateClass);
  const deleteClass = useAppStore((s) => s.deleteClass);
  const [newName, setNewName] = useState("");
  const [newError, setNewError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  function handleCreate() {
    const name = newName.trim();
    if (!name) {
      setNewError("Please enter a class name.");
      return;
    }
    const id = createClass(name);
    if (id === null) {
      setNewError(`A class named "${name}" already exists.`);
      return;
    }
    setNewName("");
    setNewError(null);
    navigate(`/classes/${id}/roster`);
  }

  function handleRename(id: string, fallback: string) {
    const name = editValue.trim();
    if (!name) {
      setEditError("Class name can't be empty.");
      return;
    }
    if (name === fallback) {
      setEditingId(null);
      setEditError(null);
      return;
    }
    const ok = renameClass(id, name);
    if (!ok) {
      setEditError(`A class named "${name}" already exists.`);
      return;
    }
    setEditingId(null);
    setEditError(null);
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
            onChange={(e) => {
              setNewName(e.target.value);
              if (newError) setNewError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button className="btn-primary" onClick={handleCreate}>Create</button>
        </div>
        {newError && <p className="mt-2 text-xs text-red-600">{newError}</p>}
      </div>

      {classes.length === 0 ? (
        <div className="card p-8 text-center text-ink-muted">No classes yet — add one above.</div>
      ) : (
        <ul className="space-y-2">
          {classes.map((c) => (
            <li key={c.id} className="card p-4">
              {editingId === c.id ? (
                <div>
                  <div className="flex items-center gap-2">
                    <input
                      className="input"
                      value={editValue}
                      autoFocus
                      onChange={(e) => {
                        setEditValue(e.target.value);
                        if (editError) setEditError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(c.id, c.name);
                        else if (e.key === "Escape") {
                          setEditingId(null);
                          setEditError(null);
                        }
                      }}
                    />
                    <button className="btn-secondary" onClick={() => handleRename(c.id, c.name)}>
                      Save
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setEditingId(null);
                        setEditError(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                  {editError && <p className="mt-2 text-xs text-red-600">{editError}</p>}
                </div>
              ) : (
                <div className="flex items-center justify-between">
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
                        setEditError(null);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        const newId = duplicateClass(c.id);
                        if (newId) navigate(`/classes/${newId}/roster`);
                      }}
                      title="Create a copy with the same students, room, and history"
                    >
                      <Icon name="copy" size={14} />
                      Duplicate
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
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
