import { useEffect, useRef } from "react";
import { Group, Rect, Circle, Shape, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { Desk, SeatId, Student, StudentId, ClassId } from "@/types";
import { useAppStore } from "@/store/appStore";
import { shouldKeepRatio } from "@/lib/shapes";

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

const NAME_FONT_SIZE = 13;
const NAME_BOX_WIDTH = 88;
const SEAT_DOT_RADIUS = 8;
const STROKE = "#334155";
const STROKE_SELECTED = "#0284c7";
const FILL = "#f8fafc";
const FILL_SELECTED = "#e0f2fe";
const STROKE_WIDTH = 2;
const STROKE_WIDTH_SELECTED = 3;
const MIN_DESK_DIM = 40;

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
  const fill = selected ? FILL_SELECTED : FILL;
  const stroke = selected ? STROKE_SELECTED : STROKE;
  const strokeWidth = selected ? STROKE_WIDTH_SELECTED : STROKE_WIDTH;
  const keepRatio = shouldKeepRatio(desk.kind);

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
          const sx = node.scaleX();
          const sy = node.scaleY();
          const newWidth = Math.max(MIN_DESK_DIM, desk.width * sx);
          const newHeight = Math.max(MIN_DESK_DIM, desk.height * sy);
          const seats = desk.seats.map((seat) => ({
            ...seat,
            offsetX: seat.offsetX * sx,
            offsetY: seat.offsetY * sy,
          }));
          // Reset scale on the node so future transforms compose cleanly.
          node.scaleX(1);
          node.scaleY(1);
          updateDesk(classId, desk.id, {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            width: newWidth,
            height: newHeight,
            seats,
          });
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
              {seat.isFrontRow && (
                <Circle
                  radius={NAME_BOX_WIDTH / 2.4}
                  fill="#fde68a"
                  stroke="#b45309"
                  strokeWidth={1}
                  opacity={0.55}
                />
              )}
              {!student ? (
                <Circle
                  radius={SEAT_DOT_RADIUS}
                  fill="#ffffff"
                  stroke={seat.isFrontRow ? "#b45309" : "#94a3b8"}
                  strokeWidth={1.5}
                />
              ) : (
                <Text
                  text={student.name}
                  fontSize={NAME_FONT_SIZE}
                  fontStyle="bold"
                  fill="#0f172a"
                  width={NAME_BOX_WIDTH}
                  align="center"
                  offsetX={NAME_BOX_WIDTH / 2}
                  offsetY={NAME_FONT_SIZE / 2}
                  listening
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
          resizeEnabled
          keepRatio={keepRatio}
          enabledAnchors={
            keepRatio
              ? ["top-left", "top-right", "bottom-left", "bottom-right"]
              : undefined
          }
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={5}
          borderStroke={STROKE_SELECTED}
          anchorStroke={STROKE_SELECTED}
          anchorFill="#ffffff"
          anchorStrokeWidth={2}
          anchorSize={10}
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
          cornerRadius={6}
        />
      );
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
      // Isoceles triangle with rounded corners — apex at top-center, base flush
      // with the bottom edge. Drawn via a custom sceneFunc that uses canvas
      // arcTo() to round each vertex.
      const w = desk.width;
      const h = desk.height;
      const cornerR = Math.min(8, Math.min(w, h) / 8);
      return (
        <Shape
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          sceneFunc={(ctx, shape) => {
            const apex = { x: w / 2, y: 0 };
            const right = { x: w, y: h };
            const left = { x: 0, y: h };
            // Start somewhere along the apex->right edge, just past the rounded apex.
            const dx = right.x - apex.x;
            const dy = right.y - apex.y;
            const len = Math.hypot(dx, dy);
            const startX = apex.x + (dx / len) * cornerR;
            const startY = apex.y + (dy / len) * cornerR;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.arcTo(right.x, right.y, left.x, left.y, cornerR);
            ctx.arcTo(left.x, left.y, apex.x, apex.y, cornerR);
            ctx.arcTo(apex.x, apex.y, right.x, right.y, cornerR);
            ctx.closePath();
            ctx.fillStrokeShape(shape);
          }}
        />
      );
    }
  }
}
