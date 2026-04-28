import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import type Konva from "konva";
import { useAppStore } from "@/store/appStore";
import RoomStage from "@/components/canvas/RoomStage";
import DeskPalette from "@/components/canvas/DeskPalette";
import AssignmentPanel from "@/components/canvas/AssignmentPanel";
import CustomShapeDialog from "@/components/designer/CustomShapeDialog";
import { BUILT_IN_SHAPES, makeDesk } from "@/lib/shapes";
import { assign } from "@/lib/assign";
import { exportStageAsJpg } from "@/lib/exportJpg";
import type { DeskId, SeatId, StudentId } from "@/types";

export default function RoomDesigner() {
  const { id } = useParams();
  const klass = useAppStore((s) => (id ? s.classes.find((c) => c.id === id) : undefined));
  const customShapes = useAppStore((s) => s.customShapes);
  const addDesk = useAppStore((s) => s.addDesk);
  const removeDesks = useAppStore((s) => s.removeDesks);
  const saveArrangement = useAppStore((s) => s.saveArrangement);

  const stageRef = useRef<Konva.Stage>(null);
  const [selectedDeskIds, setSelectedDeskIds] = useState<DeskId[]>([]);
  const [assignments, setAssignments] = useState<Record<SeatId, StudentId>>({});
  const [shapeDialogOpen, setShapeDialogOpen] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  // When the class changes, reset transient state — and check for a pending Restore from history.
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

  // Keyboard: Backspace/Delete removes selection.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if ((e.key === "Backspace" || e.key === "Delete") && selectedDeskIds.length > 0 && klass) {
        e.preventDefault();
        removeDesks(klass.id, selectedDeskIds);
        setSelectedDeskIds([]);
      } else if (e.key === "Escape") {
        setSelectedDeskIds([]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedDeskIds, klass, removeDesks]);

  const allShapes = useMemo(() => [...BUILT_IN_SHAPES, ...customShapes], [customShapes]);

  if (!klass) return <div className="p-6 text-ink-muted">Class not found.</div>;

  function placeDesk(shapeId: string) {
    if (!klass) return;
    const shape = allShapes.find((s) => s.id === shapeId);
    if (!shape) return;
    const cx = klass.room.width / 2 - shape.width / 2;
    const cy = klass.room.height / 2 - shape.height / 2;
    addDesk(klass.id, makeDesk(shape, Math.round(cx / 10) * 10, Math.round(cy / 10) * 10));
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
      // Remove any prior assignment of this student
      for (const [s, st] of Object.entries(next)) if (st === studentId) delete next[s];
      if (studentId === null) delete next[seatId];
      else next[seatId] = studentId;
      return next;
    });
  }

  return (
    <div className="flex h-full min-h-0">
      <DeskPalette
        shapes={allShapes}
        onPlace={placeDesk}
        onCreateCustom={() => setShapeDialogOpen(true)}
      />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {warning && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            <strong>Heads up:</strong> {warning}
            <button className="ml-3 text-xs underline" onClick={() => setWarning(null)}>Dismiss</button>
          </div>
        )}
        <RoomStage
          ref={stageRef}
          room={klass.room}
          customShapes={customShapes}
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
      <CustomShapeDialog open={shapeDialogOpen} onOpenChange={setShapeDialogOpen} />
    </div>
  );
}
