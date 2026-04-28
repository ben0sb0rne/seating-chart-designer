import type { Desk, DeskKind, Seat } from "@/types";

const uid = () => crypto.randomUUID();

export interface MultiRectParams {
  rows: number;
  cols: number;
}
export interface MultiSquareParams {
  perSide: number;
}
export interface MultiCircleParams {
  seatCount: number;
}
export type ShapeParams = MultiRectParams | MultiSquareParams | MultiCircleParams | undefined;

export interface LaidOutShape {
  width: number;
  height: number;
  seats: Seat[];
}

/** Build a Desk for a given kind+params at the given position. */
export function makeDesk(kind: DeskKind, params: ShapeParams, x: number, y: number): Desk {
  const layout = layoutDesk(kind, params);
  const desk: Desk = {
    id: uid(),
    kind,
    x,
    y,
    rotation: 0,
    width: layout.width,
    height: layout.height,
    seats: layout.seats,
  };
  if (kind === "multi-rect") {
    const p = params as MultiRectParams;
    desk.rows = p.rows;
    desk.cols = p.cols;
  } else if (kind === "multi-square") {
    desk.perSide = (params as MultiSquareParams).perSide;
  } else if (kind === "multi-circle") {
    desk.seatCount = (params as MultiCircleParams).seatCount;
  }
  return desk;
}

/** Compute width, height, and seat positions for a desk kind+params. */
export function layoutDesk(kind: DeskKind, params: ShapeParams): LaidOutShape {
  switch (kind) {
    case "single-rect":
      return { width: 60, height: 50, seats: [seatAt(30, 25)] };
    case "single-triangle": {
      // Equilateral triangle, base 70, height ~60. Seat at centroid.
      const w = 70;
      const h = 60;
      return { width: w, height: h, seats: [seatAt(w / 2, h * 2 / 3)] };
    }
    case "single-circle":
      return { width: 50, height: 50, seats: [seatAt(25, 25)] };
    case "multi-rect":
      return layoutMultiRect(params as MultiRectParams);
    case "multi-square":
      return layoutMultiSquare(params as MultiSquareParams);
    case "multi-circle":
      return layoutMultiCircle(params as MultiCircleParams);
  }
}

function seatAt(x: number, y: number): Seat {
  return { id: uid(), offsetX: x, offsetY: y, isFrontRow: false };
}

const CELL_W = 50;
const CELL_H = 40;

function layoutMultiRect({ rows, cols }: MultiRectParams): LaidOutShape {
  const r = clamp(rows, 1, 10);
  const c = clamp(cols, 1, 10);
  const width = c * CELL_W;
  const height = r * CELL_H;
  const seats: Seat[] = [];
  for (let row = 0; row < r; row++) {
    for (let col = 0; col < c; col++) {
      seats.push(seatAt((col + 0.5) * CELL_W, (row + 0.5) * CELL_H));
    }
  }
  return { width, height, seats };
}

function layoutMultiSquare({ perSide }: MultiSquareParams): LaidOutShape {
  const n = clamp(perSide, 1, 6);
  const side = Math.max(120, n * 36 + 24);
  const inset = 14;
  const seats: Seat[] = [];
  // For each side, place n seats evenly between corners (excluding corners).
  // Top edge (y = inset), Right edge (x = side - inset), Bottom edge (y = side - inset), Left edge (x = inset).
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1); // fractional position along the edge
    seats.push(seatAt(t * side, inset));            // top
  }
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    seats.push(seatAt(side - inset, t * side));    // right
  }
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    seats.push(seatAt((1 - t) * side, side - inset)); // bottom (reversed for clockwise order)
  }
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    seats.push(seatAt(inset, (1 - t) * side));     // left
  }
  return { width: side, height: side, seats };
}

function layoutMultiCircle({ seatCount }: MultiCircleParams): LaidOutShape {
  const n = clamp(seatCount, 3, 20);
  const diameter = Math.max(120, n * 22 + 40);
  const cx = diameter / 2;
  const cy = diameter / 2;
  const r = diameter * 0.42;
  const seats: Seat[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    seats.push(seatAt(cx + r * Math.cos(angle), cy + r * Math.sin(angle)));
  }
  return { width: diameter, height: diameter, seats };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/** True if the kind requires the user to pick parameters before placement. */
export function isMultiKind(kind: DeskKind): boolean {
  return kind === "multi-rect" || kind === "multi-square" || kind === "multi-circle";
}

/** Default params used for previews and as initial values in the params dialog. */
export function defaultParamsFor(kind: DeskKind): ShapeParams {
  switch (kind) {
    case "multi-rect":
      return { rows: 2, cols: 3 };
    case "multi-square":
      return { perSide: 2 };
    case "multi-circle":
      return { seatCount: 6 };
    default:
      return undefined;
  }
}
