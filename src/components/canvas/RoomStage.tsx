import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import type Konva from "konva";
import type { ClassId, Room, SeatId, Student, StudentId, Wall } from "@/types";
import DeskNode from "./DeskNode";
import SeatPicker from "./SeatPicker";
import { snapDeskPosition, type Guide } from "@/lib/snap";

function frontWallLine(wall: Wall, w: number, h: number): number[] {
  switch (wall) {
    case "top": return [0, 0, w, 0];
    case "right": return [w, 0, w, h];
    case "bottom": return [0, h, w, h];
    case "left": return [0, 0, 0, h];
  }
}

function FrontOfRoomLabel({ frontWall }: { frontWall: Wall }) {
  const arrow = { top: "↑", right: "→", bottom: "↓", left: "←" }[frontWall];
  const positionClass = {
    top: "top-2 left-1/2 -translate-x-1/2",
    right: "right-2 top-1/2 -translate-y-1/2",
    bottom: "bottom-2 left-1/2 -translate-x-1/2",
    left: "left-2 top-1/2 -translate-y-1/2",
  }[frontWall];
  return (
    <div
      className={`pointer-events-none absolute ${positionClass} rounded bg-ink/80 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm`}
    >
      {arrow} Front of room
    </div>
  );
}

interface Props {
  room: Room;
  selectedDeskIds: string[];
  onSelectionChange: (ids: string[]) => void;
  students: Student[];
  assignments: Record<SeatId, StudentId>;
  onAssignSeat: (seatId: SeatId, studentId: StudentId | null) => void;
  classId: ClassId;
}

const RoomStage = forwardRef<Konva.Stage, Props>(function RoomStage(
  { room, selectedDeskIds, onSelectionChange, students, assignments, onAssignSeat, classId },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  useImperativeHandle(ref, () => stageRef.current!, []);

  const [size, setSize] = useState({ w: 800, h: 600 });
  const [guides, setGuides] = useState<Guide[]>([]);
  const [picker, setPicker] = useState<{ seatId: SeatId; x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      setSize({ w: cr.width, h: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const padding = 40;
  const scale = Math.min(
    (size.w - padding * 2) / room.width,
    (size.h - padding * 2) / room.height,
  );
  const safeScale = isFinite(scale) && scale > 0 ? scale : 1;
  const offsetX = (size.w - room.width * safeScale) / 2;
  const offsetY = (size.h - room.height * safeScale) / 2;

  function handleStageClick(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (e.target === e.target.getStage() || e.target.attrs.id === "room-bg") {
      onSelectionChange([]);
    }
  }

  function handleSelectDesk(deskId: string, additive: boolean) {
    if (additive) {
      onSelectionChange(
        selectedDeskIds.includes(deskId)
          ? selectedDeskIds.filter((id) => id !== deskId)
          : [...selectedDeskIds, deskId],
      );
    } else {
      onSelectionChange([deskId]);
    }
  }

  return (
    <div ref={containerRef} className="relative min-h-0 flex-1 bg-slate-100" style={{ touchAction: "none" }}>
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        onMouseDown={handleStageClick}
        onTouchStart={handleStageClick}
      >
        <Layer x={offsetX} y={offsetY} scaleX={safeScale} scaleY={safeScale}>
          <Rect
            id="room-bg"
            x={0}
            y={0}
            width={room.width}
            height={room.height}
            fill="#fafaf7"
            stroke="#cbd5e1"
            strokeWidth={2 / safeScale}
          />

          <Line
            points={frontWallLine(room.frontWall ?? "top", room.width, room.height)}
            stroke="#0f172a"
            strokeWidth={5 / safeScale}
            dash={[12 / safeScale, 8 / safeScale]}
          />

          {room.desks.map((desk) => (
            <DeskNode
              key={desk.id}
              desk={desk}
              selected={selectedDeskIds.includes(desk.id)}
              onSelect={(additive) => handleSelectDesk(desk.id, additive)}
              students={students}
              assignments={assignments}
              onSeatClick={(seatId, x, y) => {
                const rect = containerRef.current?.getBoundingClientRect();
                setPicker({ seatId, x: (rect?.left ?? 0) + x, y: (rect?.top ?? 0) + y });
              }}
              onDragMove={(deskId, x, y) => {
                const d = room.desks.find((dd) => dd.id === deskId);
                if (!d) return { x, y };
                const result = snapDeskPosition(d, x, y, room.desks);
                setGuides(result.guides);
                return { x: result.x, y: result.y };
              }}
              onDragEnd={() => setGuides([])}
              classId={classId}
            />
          ))}

          {guides.map((g, i) =>
            g.axis === "x" ? (
              <Line
                key={`gx-${i}`}
                points={[g.position, 0, g.position, room.height]}
                stroke="#ec4899"
                strokeWidth={1 / safeScale}
                dash={[4 / safeScale, 3 / safeScale]}
                listening={false}
              />
            ) : (
              <Line
                key={`gy-${i}`}
                points={[0, g.position, room.width, g.position]}
                stroke="#ec4899"
                strokeWidth={1 / safeScale}
                dash={[4 / safeScale, 3 / safeScale]}
                listening={false}
              />
            ),
          )}
        </Layer>
      </Stage>
      <FrontOfRoomLabel frontWall={room.frontWall ?? "top"} />
      {picker && (
        <SeatPicker
          x={picker.x}
          y={picker.y}
          seatId={picker.seatId}
          students={students}
          assignments={assignments}
          onPick={(studentId) => {
            onAssignSeat(picker.seatId, studentId);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
});

export default RoomStage;
