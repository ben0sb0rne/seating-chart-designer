import type { Desk } from "@/types";
import { findShape } from "@/lib/shapes";
import type { DeskShape } from "@/types";

export const GRID = 10;
export const SNAP_THRESHOLD = 6;

export function snapToGrid(value: number): number {
  return Math.round(value / GRID) * GRID;
}

export interface Guide {
  axis: "x" | "y";
  position: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: Guide[];
}

export interface BoundingBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

export function deskBounds(desk: Desk, customShapes: DeskShape[]): BoundingBox | null {
  const shape = findShape(desk.shapeId, customShapes);
  if (!shape) return null;
  const w = shape.kind === "circle" ? shape.width : shape.width;
  const h = shape.kind === "circle" ? shape.width : shape.height;
  return {
    left: desk.x,
    right: desk.x + w,
    top: desk.y,
    bottom: desk.y + h,
    centerX: desk.x + w / 2,
    centerY: desk.y + h / 2,
  };
}

/** Snap the desk's top-left to the grid AND to nearby other desks' edges/centers. */
export function snapDeskPosition(
  desk: Desk,
  proposedX: number,
  proposedY: number,
  others: Desk[],
  customShapes: DeskShape[],
): SnapResult {
  const shape = findShape(desk.shapeId, customShapes);
  if (!shape) return { x: snapToGrid(proposedX), y: snapToGrid(proposedY), guides: [] };
  const w = shape.kind === "circle" ? shape.width : shape.width;
  const h = shape.kind === "circle" ? shape.width : shape.height;

  const otherBounds = others
    .filter((d) => d.id !== desk.id)
    .map((d) => deskBounds(d, customShapes))
    .filter((b): b is BoundingBox => b !== null);

  let bestX = snapToGrid(proposedX);
  let bestY = snapToGrid(proposedY);
  const guides: Guide[] = [];

  // X-axis candidates: my left, my centerX, my right.
  const myXCandidates = (x: number) => [
    { mine: "left" as const, value: x },
    { mine: "center" as const, value: x + w / 2 },
    { mine: "right" as const, value: x + w },
  ];

  let bestDx = SNAP_THRESHOLD + 1;
  for (const cand of myXCandidates(proposedX)) {
    for (const b of otherBounds) {
      for (const target of [b.left, b.centerX, b.right]) {
        const delta = target - cand.value;
        if (Math.abs(delta) < Math.abs(bestDx)) {
          bestDx = delta;
        }
      }
    }
  }
  if (Math.abs(bestDx) <= SNAP_THRESHOLD) {
    bestX = proposedX + bestDx;
    // Re-determine which line was hit for the guide:
    for (const cand of myXCandidates(bestX)) {
      for (const b of otherBounds) {
        for (const target of [b.left, b.centerX, b.right]) {
          if (Math.abs(target - cand.value) < 0.5) guides.push({ axis: "x", position: target });
        }
      }
    }
  }

  const myYCandidates = (y: number) => [
    { mine: "top" as const, value: y },
    { mine: "middle" as const, value: y + h / 2 },
    { mine: "bottom" as const, value: y + h },
  ];

  let bestDy = SNAP_THRESHOLD + 1;
  for (const cand of myYCandidates(proposedY)) {
    for (const b of otherBounds) {
      for (const target of [b.top, b.centerY, b.bottom]) {
        const delta = target - cand.value;
        if (Math.abs(delta) < Math.abs(bestDy)) {
          bestDy = delta;
        }
      }
    }
  }
  if (Math.abs(bestDy) <= SNAP_THRESHOLD) {
    bestY = proposedY + bestDy;
    for (const cand of myYCandidates(bestY)) {
      for (const b of otherBounds) {
        for (const target of [b.top, b.centerY, b.bottom]) {
          if (Math.abs(target - cand.value) < 0.5) guides.push({ axis: "y", position: target });
        }
      }
    }
  }

  return { x: bestX, y: bestY, guides };
}
