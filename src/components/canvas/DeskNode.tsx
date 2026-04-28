import { useEffect, useRef } from "react";
import { Group, Rect, Circle, RegularPolygon, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { Desk, SeatId, Student, StudentId, ClassId } from "@/types";
import { useAppStore } from "@/store/appStore";

interface Props {
  desk: Desk;
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

  useEffect(() => {
    if (selected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selected]);

  const allFront = desk.seats.length > 0 && desk.seats.every((s) => s.isFrontRow);
  const fill = selected ? "#e0f2fe" : "#f1f5f9";
  const stroke = selected ? "#0284c7" : "#475569";
  const strokeWidth = selected ? 2 : 1;

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
        <DeskShapeRenderer desk={desk} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />

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

function DeskShapeRenderer({
  desk,
  fill,
  stroke,
  strokeWidth,
}: {
  desk: Desk;
  fill: string;
  stroke: string;
  strokeWidth: number;
}) {
  switch (desk.kind) {
    case "single-rect":
    case "multi-rect":
    case "multi-square":
      return (
        <Rect
          x={0}
          y={0}
          width={desk.width}
          height={desk.height}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          cornerRadius={4}
        />
      );
    case "single-circle":
    case "multi-circle":
      return (
        <Circle
          x={desk.width / 2}
          y={desk.height / 2}
          radius={desk.width / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    case "single-triangle": {
      // For an equilateral triangle with apex up: centroid sits at 2/3 down from the apex,
      // and the circumradius equals that same distance. Konva's RegularPolygon is centered
      // on its centroid and at rotation 0 has a vertex pointing up.
      const r = (desk.height * 2) / 3;
      return (
        <RegularPolygon
          x={desk.width / 2}
          y={r}
          sides={3}
          radius={r}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }
  }
}
