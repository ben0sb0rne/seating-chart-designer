import type { Desk } from "@/types";

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

export function deskBounds(desk: Desk): BoundingBox {
  return {
    left: desk.x,
    right: desk.x + desk.width,
    top: desk.y,
    bottom: desk.y + desk.height,
    centerX: desk.x + desk.width / 2,
    centerY: desk.y + desk.height / 2,
  };
}

/** Snap the desk's top-left to the grid AND to nearby other desks' edges/centers. */
export function snapDeskPosition(
  desk: Desk,
  proposedX: number,
  proposedY: number,
  others: Desk[],
): SnapResult {
  const w = desk.width;
  const h = desk.height;

  const otherBounds = others.filter((d) => d.id !== desk.id).map(deskBounds);

  let bestX = snapToGrid(proposedX);
  let bestY = snapToGrid(proposedY);
  const guides: Guide[] = [];

  const myXCandidates = (x: number) => [
    { value: x },
    { value: x + w / 2 },
    { value: x + w },
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
    for (const cand of myXCandidates(bestX)) {
      for (const b of otherBounds) {
        for (const target of [b.left, b.centerX, b.right]) {
          if (Math.abs(target - cand.value) < 0.5) guides.push({ axis: "x", position: target });
        }
      }
    }
  }

  const myYCandidates = (y: number) => [
    { value: y },
    { value: y + h / 2 },
    { value: y + h },
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
