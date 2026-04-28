export type ClassId = string;
export type StudentId = string;
export type DeskId = string;
export type SeatId = string;
export type ShapeId = string;
export type ArrangementId = string;

export interface Student {
  id: StudentId;
  name: string;
  needsFrontRow: boolean;
  keepApart: StudentId[];
  notes?: string;
}

export interface Seat {
  id: SeatId;
  offsetX: number;
  offsetY: number;
  isFrontRow: boolean;
}

export interface Desk {
  id: DeskId;
  shapeId: ShapeId;
  x: number;
  y: number;
  rotation: number;
  seats: Seat[];
}

export type DeskShapeKind = "rect" | "circle";

export interface DeskShape {
  id: ShapeId;
  name: string;
  kind: DeskShapeKind;
  width: number;
  height: number;
  seatCount: number;
  builtIn: boolean;
}

export interface Room {
  width: number;
  height: number;
  desks: Desk[];
}

export interface Arrangement {
  id: ArrangementId;
  createdAt: string;
  label?: string;
  assignments: Record<SeatId, StudentId>;
}

export interface ClassRoom {
  id: ClassId;
  name: string;
  students: Student[];
  room: Room;
  arrangements: Arrangement[];
}

export const SCHEMA_VERSION = 1 as const;

export interface AppState {
  classes: ClassRoom[];
  customShapes: DeskShape[];
  activeClassId: ClassId | null;
  schemaVersion: typeof SCHEMA_VERSION;
}
