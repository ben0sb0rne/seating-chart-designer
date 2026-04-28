import type { Desk, DeskShape, Seat, ShapeId } from "@/types";

const uid = () => crypto.randomUUID();

export const BUILT_IN_SHAPES: DeskShape[] = [
  { id: "single", name: "Single desk", kind: "rect", width: 60, height: 50, seatCount: 1, builtIn: true },
  { id: "paired", name: "Paired desks", kind: "rect", width: 120, height: 50, seatCount: 2, builtIn: true },
  { id: "table-rect-4", name: "Rect table (4)", kind: "rect", width: 140, height: 80, seatCount: 4, builtIn: true },
  { id: "table-rect-6", name: "Rect table (6)", kind: "rect", width: 200, height: 80, seatCount: 6, builtIn: true },
  { id: "table-round-4", name: "Round table (4)", kind: "circle", width: 120, height: 120, seatCount: 4, builtIn: true },
  { id: "table-round-6", name: "Round table (6)", kind: "circle", width: 140, height: 140, seatCount: 6, builtIn: true },
];

export function findShape(shapeId: ShapeId, customShapes: DeskShape[]): DeskShape | undefined {
  return BUILT_IN_SHAPES.find((s) => s.id === shapeId) ?? customShapes.find((s) => s.id === shapeId);
}

/** Lay out N seats inside the shape's local coordinate space (origin at top-left). */
export function layoutSeats(shape: DeskShape): Seat[] {
  if (shape.seatCount <= 0) return [];
  if (shape.kind === "circle") {
    return layoutSeatsCircle(shape);
  }
  return layoutSeatsRect(shape);
}

function layoutSeatsRect(shape: DeskShape): Seat[] {
  const { width, height, seatCount } = shape;
  // Choose a grid that's roughly proportional to the rectangle.
  const aspect = width / height;
  const cols = Math.max(1, Math.round(Math.sqrt(seatCount * aspect)));
  const rows = Math.max(1, Math.ceil(seatCount / cols));
  const seats: Seat[] = [];
  let placed = 0;
  for (let r = 0; r < rows && placed < seatCount; r++) {
    const remaining = seatCount - placed;
    const colsThisRow = Math.min(cols, remaining);
    for (let c = 0; c < colsThisRow; c++) {
      const x = ((c + 0.5) / colsThisRow) * width;
      const y = ((r + 0.5) / rows) * height;
      seats.push({ id: uid(), offsetX: x, offsetY: y, isFrontRow: false });
      placed++;
    }
  }
  return seats;
}

function layoutSeatsCircle(shape: DeskShape): Seat[] {
  const { width, seatCount } = shape;
  const cx = width / 2;
  const cy = width / 2;
  const r = width * 0.42;
  const seats: Seat[] = [];
  for (let i = 0; i < seatCount; i++) {
    const angle = (i / seatCount) * Math.PI * 2 - Math.PI / 2;
    seats.push({
      id: uid(),
      offsetX: cx + r * Math.cos(angle),
      offsetY: cy + r * Math.sin(angle),
      isFrontRow: false,
    });
  }
  return seats;
}

export function makeDesk(shape: DeskShape, x: number, y: number): Desk {
  return {
    id: uid(),
    shapeId: shape.id,
    x,
    y,
    rotation: 0,
    seats: layoutSeats(shape),
  };
}
