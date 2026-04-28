import { useMemo } from "react";
import type { ClassRoom, SeatId, StudentId } from "@/types";
import { roomSeats } from "@/lib/adjacency";

interface Props {
  klass: ClassRoom;
  assignments: Record<SeatId, StudentId>;
  onAssignSeat: (seatId: SeatId, studentId: StudentId | null) => void;
  onRandomize: () => void;
  onSave: () => void;
  onExportJpg: () => void;
}

export default function AssignmentPanel({
  klass,
  assignments,
  onAssignSeat,
  onRandomize,
  onSave,
  onExportJpg,
}: Props) {
  const seats = useMemo(() => roomSeats(klass.room), [klass.room]);
  const seated = new Set(Object.values(assignments));
  const unseated = klass.students.filter((s) => !seated.has(s.id));

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="space-y-2 border-b border-slate-200 p-3">
        <button className="btn-primary w-full" onClick={onRandomize}>Randomize seating</button>
        <button className="btn-secondary w-full" onClick={onSave}>Save this arrangement</button>
        <button className="btn-secondary w-full" onClick={onExportJpg}>Export JPG</button>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="label">Assignments</span>
          <span className="text-xs text-ink-muted">{Object.keys(assignments).length} / {seats.length}</span>
        </div>
        <ul className="space-y-1 text-sm">
          {seats.length === 0 ? (
            <li className="text-ink-muted">Add some desks to the room first.</li>
          ) : (
            seats.map((s, idx) => {
              const studentId = assignments[s.seatId];
              const student = studentId ? klass.students.find((x) => x.id === studentId) : undefined;
              return (
                <li key={s.seatId} className="flex items-center justify-between gap-2 rounded px-1 py-1 hover:bg-slate-50">
                  <span className="text-xs text-ink-muted">
                    Seat {idx + 1}{s.isFrontRow && <span className="ml-1 text-amber-700">·front</span>}
                  </span>
                  <span className="flex-1 truncate text-right">{student?.name ?? <em className="text-ink-muted">empty</em>}</span>
                  {student && (
                    <button
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => onAssignSeat(s.seatId, null)}
                      title="Clear"
                    >
                      ×
                    </button>
                  )}
                </li>
              );
            })
          )}
        </ul>

        {unseated.length > 0 && (
          <>
            <div className="label mt-4 mb-2">Not yet seated ({unseated.length})</div>
            <ul className="space-y-1 text-sm">
              {unseated.map((s) => (
                <li key={s.id} className="flex items-center gap-2 px-1 py-0.5">
                  <span className="truncate">{s.name}</span>
                  {s.needsFrontRow && <span className="text-xs text-amber-700">front</span>}
                  {s.keepApart.length > 0 && (
                    <span className="text-xs text-ink-muted">·{s.keepApart.length} kept apart</span>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="border-t border-slate-200 p-3 text-xs text-ink-muted">
        Click any seat on the canvas to assign a student manually. Right-click a desk to mark its seats as front-row.
      </div>
    </aside>
  );
}
