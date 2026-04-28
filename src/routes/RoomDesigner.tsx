import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import type Konva from "konva";
import { useAppStore } from "@/store/appStore";
import RoomStage from "@/components/canvas/RoomStage";
import DeskPalette from "@/components/canvas/DeskPalette";
import AssignmentPanel from "@/components/canvas/AssignmentPanel";
import MultiShapeParamsDialog from "@/components/designer/MultiShapeParamsDialog";
import { cloneDeskWithFreshIds, defaultParamsFor, layoutDesk, makeDesk, type ShapeParams } from "@/lib/shapes";
import { assign } from "@/lib/assign";
import { exportStageAsJpg } from "@/lib/exportJpg";
import type { Desk, DeskId, DeskKind, SeatId, StudentId } from "@/types";

const PASTE_OFFSET = 20;

export default function RoomDesigner() {
  const { id } = useParams();
  const klass = useAppStore((s) => (id ? s.classes.find((c) => c.id === id) : undefined));
  const addDesk = useAppStore((s) => s.addDesk);
  const addDesks = useAppStore((s) => s.addDesks);
  const removeDesks = useAppStore((s) => s.removeDesks);
  const saveArrangement = useAppStore((s) => s.saveArrangement);

  const stageRef = useRef<Konva.Stage>(null);
  const [selectedDeskIds, setSelectedDeskIds] = useState<DeskId[]>([]);
  const [assignments, setAssignments] = useState<Record<SeatId, StudentId>>({});
  const [paramsDialog, setParamsDialog] = useState<{ open: boolean; kind: DeskKind | null }>({
    open: false,
    kind: null,
  });
  const [warning, setWarning] = useState<string | null>(null);
  /** Snapshot of desks copied via Ctrl+C; offset is applied at paste time. */
  const [clipboard, setClipboard] = useState<Desk[]>([]);

  useEffect(() => {
    setSelectedDeskIds([]);
    setWarning(null);
    if (!klass) {
      setAssignments({});
      return;
    }
    const restoreId = sessionStorage.getItem(`restore:${klass.id}`);
    if (restoreId) {
      sessionStorage.removeItem(`restore:${klass.id}`);
      const arr = klass.arrangements.find((a) => a.id === restoreId);
      if (arr) {
        setAssignments({ ...arr.assignments });
        return;
      }
    }
    setAssignments({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const mod = e.ctrlKey || e.metaKey;

      if ((e.key === "Backspace" || e.key === "Delete") && selectedDeskIds.length > 0 && klass) {
        e.preventDefault();
        removeDesks(klass.id, selectedDeskIds);
        setSelectedDeskIds([]);
      } else if (e.key === "Escape") {
        setSelectedDeskIds([]);
      } else if (mod && e.key.toLowerCase() === "c" && klass && selectedDeskIds.length > 0) {
        e.preventDefault();
        const selected = klass.room.desks.filter((d) => selectedDeskIds.includes(d.id));
        setClipboard(selected);
      } else if (mod && e.key.toLowerCase() === "v" && klass && clipboard.length > 0) {
        e.preventDefault();
        const cloned = clipboard.map((d) => cloneDeskWithFreshIds(d, PASTE_OFFSET, PASTE_OFFSET));
        addDesks(klass.id, cloned);
        setSelectedDeskIds(cloned.map((d) => d.id));
        // Update the clipboard with the offset versions so subsequent pastes step further down/right.
        setClipboard(cloned);
      } else if (mod && e.key.toLowerCase() === "d" && klass && selectedDeskIds.length > 0) {
        e.preventDefault();
        const selected = klass.room.desks.filter((d) => selectedDeskIds.includes(d.id));
        const cloned = selected.map((d) => cloneDeskWithFreshIds(d, PASTE_OFFSET, PASTE_OFFSET));
        addDesks(klass.id, cloned);
        setSelectedDeskIds(cloned.map((d) => d.id));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedDeskIds, klass, removeDesks, addDesks, clipboard]);

  if (!klass) return <div className="p-6 text-ink-muted">Class not found.</div>;

  function placeDeskAtCenter(kind: DeskKind, params: ShapeParams) {
    if (!klass) return;
    const layout = layoutDesk(kind, params);
    const cx = klass.room.width / 2 - layout.width / 2;
    const cy = klass.room.height / 2 - layout.height / 2;
    const x = Math.round(cx / 10) * 10;
    const y = Math.round(cy / 10) * 10;
    addDesk(klass.id, makeDesk(kind, params, x, y));
  }

  function handlePlaceSingle(kind: DeskKind) {
    placeDeskAtCenter(kind, undefined);
  }

  function handleOpenMulti(kind: DeskKind) {
    // The dialog itself uses its own defaults; the kind tells it which inputs to show.
    setParamsDialog({ open: true, kind });
  }

  function handleConfirmMulti(kind: DeskKind, params: ShapeParams) {
    placeDeskAtCenter(kind, params ?? defaultParamsFor(kind));
  }

  function handleRandomize() {
    if (!klass) return;
    setWarning(null);
    const result = assign({ room: klass.room, students: klass.students, history: klass.arrangements });
    if (!result.ok) {
      setWarning(result.reason);
      return;
    }
    setAssignments(result.assignments);
  }

  function handleSaveArrangement() {
    if (!klass) return;
    const occupied = Object.keys(assignments).length;
    if (occupied === 0) {
      setWarning("Nothing to save — assign students first (try Randomize).");
      return;
    }
    const label = prompt("Label for this arrangement (optional):") ?? undefined;
    saveArrangement(klass.id, assignments, label || undefined);
    setWarning(null);
  }

  function handleExportJpg() {
    if (!stageRef.current || !klass) return;
    const date = new Date().toISOString().slice(0, 10);
    exportStageAsJpg(stageRef.current, `${klass.name.replace(/\s+/g, "_")}_${date}`);
  }

  function handleAssignSeat(seatId: SeatId, studentId: StudentId | null) {
    setAssignments((prev) => {
      const next = { ...prev };
      for (const [s, st] of Object.entries(next)) if (st === studentId) delete next[s];
      if (studentId === null) delete next[seatId];
      else next[seatId] = studentId;
      return next;
    });
  }

  return (
    <div className="flex h-full min-h-0">
      <DeskPalette onPlaceSingle={handlePlaceSingle} onOpenMulti={handleOpenMulti} />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {warning && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            <strong>Heads up:</strong> {warning}
            <button className="ml-3 text-xs underline" onClick={() => setWarning(null)}>
              Dismiss
            </button>
          </div>
        )}
        <RoomStage
          ref={stageRef}
          room={klass.room}
          selectedDeskIds={selectedDeskIds}
          onSelectionChange={setSelectedDeskIds}
          students={klass.students}
          assignments={assignments}
          onAssignSeat={handleAssignSeat}
          classId={klass.id}
        />
      </div>
      <AssignmentPanel
        klass={klass}
        assignments={assignments}
        onAssignSeat={handleAssignSeat}
        onRandomize={handleRandomize}
        onSave={handleSaveArrangement}
        onExportJpg={handleExportJpg}
      />
      <MultiShapeParamsDialog
        open={paramsDialog.open}
        onOpenChange={(open) => setParamsDialog((p) => ({ ...p, open }))}
        kind={paramsDialog.kind}
        onConfirm={handleConfirmMulti}
      />
    </div>
  );
}
