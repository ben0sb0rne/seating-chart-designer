import { useEffect, useRef } from "react";
import { Group, Rect, Circle, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { Desk, DeskShape, SeatId, Student, StudentId, ClassId } from "@/types";
import { findShape } from "@/lib/shapes";
import { useAppStore } from "@/store/appStore";

interface Props {
  desk: Desk;
  customShapes: DeskShape[];
  selected: boolean;
  onSelect: (additive: boolean) => void;
  students: Student[];
  assignments: Record<SeatId, StudentId>;
  onSeatClick: (seatId: SeatId, screenX: number, screenY: number) => void;
  onDragMove: (deskId: string, x: number, y: number) => { x: number; y: number };
  onDragEnd: () => void;
  classId: ClassId;
}

export default function DeskNode({
  desk,
  customShapes,
  selected,
  onSelect,
  students,
  assignments,
  onSeatClick,
  onDragMove,
  onDragEnd,
  classId,
}: Props) {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const updateDesk = useAppStore((s) => s.updateDesk);
  const setDeskFrontRow = useAppStore((s) => s.setDeskFrontRow);
  const setSeatFrontRow = useAppStore((s) => s.setSeatFrontRow);

  const shape = findShape(desk.shapeId, customShapes);

  useEffect(() => {
    if (selected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selected]);

  if (!shape) return null;

  const allFront = desk.seats.length > 0 && desk.seats.every((s) => s.isFrontRow);

  return (
    <>
      <Group
        ref={groupRef}
        x={desk.x}
        y={desk.y}
        rotation={desk.rotation}
        draggable
        onMouseDown={(e) => {
          e.cancelBubble = true;
          onSelect(e.evt.shiftKey);
        }}
        onTouchStart={(e) => {
          e.cancelBubble = true;
          onSelect(false);
        }}
        onContextMenu={(e) => {
          e.evt.preventDefault();
          e.cancelBubble = true;
          setDeskFrontRow(classId, desk.id, !allFront);
        }}
        onDragMove={(e) => {
          const node = e.target;
          const snapped = onDragMove(desk.id, node.x(), node.y());
          node.x(snapped.x);
          node.y(snapped.y);
        }}
        onDragEnd={(e) => {
          updateDesk(classId, desk.id, { x: e.target.x(), y: e.target.y() });
          onDragEnd();
        }}
        onTransformEnd={() => {
          const node = groupRef.current;
          if (!node) return;
          updateDesk(classId, desk.id, { x: node.x(), y: node.y(), rotation: node.rotation() });
        }}
      >
        {shape.kind === "circle" ? (
          <Circle
            x={shape.width / 2}
            y={shape.width / 2}
            radius={shape.width / 2}
            fill={selected ? "#e0f2fe" : "#f1f5f9"}
            stroke={selected ? "#0284c7" : "#475569"}
            strokeWidth={selected ? 2 : 1}
          />
        ) : (
          <Rect
            x={0}
            y={0}
            width={shape.width}
            height={shape.height}
            fill={selected ? "#e0f2fe" : "#f1f5f9"}
            stroke={selected ? "#0284c7" : "#475569"}
            strokeWidth={selected ? 2 : 1}
            cornerRadius={4}
          />
        )}

        {desk.seats.map((seat) => {
          const studentId = assignments[seat.id];
          const student = studentId ? students.find((s) => s.id === studentId) : undefined;
          return (
            <Group
              key={seat.id}
              x={seat.offsetX}
              y={seat.offsetY}
              onMouseDown={(e) => {
                e.cancelBubble = true;
              }}
              onClick={(e) => {
                e.cancelBubble = true;
                const stage = e.target.getStage();
                const pos = stage?.getPointerPosition();
                if (pos) onSeatClick(seat.id, pos.x, pos.y);
              }}
              onTap={(e) => {
                e.cancelBubble = true;
                const stage = e.target.getStage();
                const pos = stage?.getPointerPosition();
                if (pos) onSeatClick(seat.id, pos.x, pos.y);
              }}
              onContextMenu={(e) => {
                e.evt.preventDefault();
                e.cancelBubble = true;
                setSeatFrontRow(classId, desk.id, seat.id, !seat.isFrontRow);
              }}
            >
              <Circle
                radius={14}
                fill={seat.isFrontRow ? "#fde68a" : "#ffffff"}
                stroke={seat.isFrontRow ? "#b45309" : "#94a3b8"}
                strokeWidth={seat.isFrontRow ? 2 : 1}
              />
              {student && (
                <Text
                  text={student.name}
                  fontSize={9}
                  fill="#0f172a"
                  width={80}
                  align="center"
                  offsetX={40}
                  offsetY={-16}
                />
              )}
            </Group>
          );
        })}
      </Group>

      {selected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled
          resizeEnabled={false}
          borderStroke="#0284c7"
          anchorStroke="#0284c7"
          anchorFill="#ffffff"
        />
      )}
    </>
  );
}
