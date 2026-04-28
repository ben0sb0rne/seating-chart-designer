import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppState,
  Arrangement,
  ArrangementId,
  ClassId,
  ClassRoom,
  Desk,
  DeskId,
  Room,
  Seat,
  SeatId,
  Student,
  StudentId,
} from "@/types";
import { SCHEMA_VERSION } from "@/types";

const uid = () => crypto.randomUUID();

const DEFAULT_ROOM = (): Room => ({ width: 1000, height: 700, frontWall: "top", desks: [] });

interface AppActions {
  // Class CRUD
  createClass: (name: string) => ClassId;
  renameClass: (id: ClassId, name: string) => void;
  deleteClass: (id: ClassId) => void;
  setActiveClass: (id: ClassId | null) => void;

  // Roster
  addStudents: (classId: ClassId, names: string[]) => void;
  updateStudent: (classId: ClassId, studentId: StudentId, patch: Partial<Student>) => void;
  removeStudent: (classId: ClassId, studentId: StudentId) => void;
  toggleKeepApart: (classId: ClassId, a: StudentId, b: StudentId) => void;

  // Room / desks
  addDesk: (classId: ClassId, desk: Desk) => void;
  addDesks: (classId: ClassId, desks: Desk[]) => void;
  updateDesk: (classId: ClassId, deskId: DeskId, patch: Partial<Desk>) => void;
  removeDesks: (classId: ClassId, deskIds: DeskId[]) => void;
  updateRoom: (classId: ClassId, patch: Partial<Room>) => void;
  setSeatFrontRow: (classId: ClassId, deskId: DeskId, seatId: SeatId, value: boolean) => void;
  setDeskFrontRow: (classId: ClassId, deskId: DeskId, value: boolean) => void;
  updateSeat: (classId: ClassId, deskId: DeskId, seatId: SeatId, patch: Partial<Seat>) => void;

  // Arrangements
  saveArrangement: (
    classId: ClassId,
    assignments: Record<SeatId, StudentId>,
    label?: string,
  ) => { id: ArrangementId };
  deleteArrangement: (classId: ClassId, arrangementId: ArrangementId) => void;

  // Bulk
  replaceState: (next: AppState) => void;
}

export type AppStore = AppState & AppActions;

function findClass(state: AppState, id: ClassId): ClassRoom | undefined {
  return state.classes.find((c) => c.id === id);
}

function withClass(state: AppState, id: ClassId, mutate: (c: ClassRoom) => ClassRoom): AppState {
  return { ...state, classes: state.classes.map((c) => (c.id === id ? mutate(c) : c)) };
}

/** v3 → v4: the "single-circle" desk kind was removed; convert any existing ones to single-rect. */
function migrateV3toV4(persisted: unknown): AppState {
  const obj = persisted as Record<string, unknown>;
  const classes = (obj.classes ?? []) as Array<Record<string, unknown>>;
  const migratedClasses = classes.map((klass) => {
    const room = (klass.room ?? { width: 1000, height: 700, frontWall: "top", desks: [] }) as Record<string, unknown>;
    const desks = ((room.desks as Array<Record<string, unknown>>) ?? []).map((d) =>
      d.kind === "single-circle" ? { ...d, kind: "single-rect" } : d,
    );
    return {
      ...(klass as object),
      room: {
        width: (room.width as number) ?? 1000,
        height: (room.height as number) ?? 700,
        frontWall: (room.frontWall as string) ?? "top",
        desks,
      },
    } as ClassRoom;
  });
  return {
    classes: migratedClasses,
    activeClassId: (obj.activeClassId as string | null) ?? null,
    schemaVersion: SCHEMA_VERSION,
  };
}

/** v2 → v3: rooms gain a `frontWall` field. Default to "top" so behavior is unchanged. */
function migrateV2toV3(persisted: unknown): AppState {
  const obj = persisted as Record<string, unknown>;
  const classes = (obj.classes ?? []) as Array<Record<string, unknown>>;
  const migratedClasses = classes.map((klass) => {
    const room = (klass.room ?? { width: 1000, height: 700, desks: [] }) as Record<string, unknown>;
    return {
      ...(klass as object),
      room: {
        width: (room.width as number) ?? 1000,
        height: (room.height as number) ?? 700,
        frontWall: (room.frontWall as string) ?? "top",
        desks: (room.desks as unknown[]) ?? [],
      },
    } as ClassRoom;
  });
  return {
    classes: migratedClasses,
    activeClassId: (obj.activeClassId as string | null) ?? null,
    schemaVersion: SCHEMA_VERSION,
  };
}

/**
 * Migrate persisted state from v1 (DeskShape-based) to v2 (kind-on-Desk).
 * - Built-in shape ids map to specific kinds & params.
 * - Custom shapes are dropped (best-effort fallback to single-rect; user warned).
 */
function migrateV1toV2(persisted: unknown): AppState {
  const obj = persisted as Record<string, unknown>;
  const classes = (obj.classes ?? []) as Array<Record<string, unknown>>;
  let droppedCustomShapes = 0;

  const migratedClasses: ClassRoom[] = classes.map((klass) => {
    const room = (klass.room ?? { width: 1000, height: 700, desks: [] }) as {
      width: number;
      height: number;
      desks: Array<Record<string, unknown>>;
    };
    const desks: Desk[] = (room.desks ?? []).map((d) => migrateDesk(d, () => droppedCustomShapes++));
    return {
      id: klass.id as string,
      name: klass.name as string,
      students: (klass.students as Student[]) ?? [],
      room: { width: room.width, height: room.height, frontWall: "top", desks },
      arrangements: (klass.arrangements as Arrangement[]) ?? [],
    };
  });

  if (droppedCustomShapes > 0 && typeof window !== "undefined") {
    setTimeout(() => {
      window.alert(
        `Note: ${droppedCustomShapes} custom-shape desk${droppedCustomShapes === 1 ? "" : "s"} from a previous version ` +
          `couldn't be migrated cleanly and were converted to single-student desks. You can replace them using the new shape palette.`,
      );
    }, 500);
  }

  return {
    classes: migratedClasses,
    activeClassId: (obj.activeClassId as string | null) ?? null,
    schemaVersion: SCHEMA_VERSION,
  };
}

function migrateDesk(d: Record<string, unknown>, onCustomDropped: () => void): Desk {
  // If the desk already has a `kind` field, it's already v2 — pass through.
  if (typeof d.kind === "string") {
    return d as unknown as Desk;
  }
  const shapeId = d.shapeId as string | undefined;
  const seats = (d.seats as Seat[]) ?? [];
  const x = (d.x as number) ?? 0;
  const y = (d.y as number) ?? 0;
  const rotation = (d.rotation as number) ?? 0;
  const id = (d.id as string) ?? uid();

  const base = { id, x, y, rotation, seats };

  switch (shapeId) {
    case "single":
      return { ...base, kind: "single-rect", width: 60, height: 50 };
    case "paired":
      return { ...base, kind: "multi-rect", width: 100, height: 40, rows: 1, cols: 2 };
    case "table-rect-4":
      return { ...base, kind: "multi-rect", width: 100, height: 80, rows: 2, cols: 2 };
    case "table-rect-6":
      return { ...base, kind: "multi-rect", width: 150, height: 80, rows: 2, cols: 3 };
    case "table-round-4":
      return { ...base, kind: "multi-circle", width: 120, height: 120, seatCount: 4 };
    case "table-round-6":
      return { ...base, kind: "multi-circle", width: 162, height: 162, seatCount: 6 };
    default:
      // Unknown / custom shape — fall back to single-rect.
      onCustomDropped();
      return { ...base, kind: "single-rect", width: 60, height: 50 };
  }
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      classes: [],
      activeClassId: null,
      schemaVersion: SCHEMA_VERSION,

      createClass: (name) => {
        const id = uid();
        const klass: ClassRoom = { id, name, students: [], room: DEFAULT_ROOM(), arrangements: [] };
        set((s) => ({ ...s, classes: [...s.classes, klass], activeClassId: s.activeClassId ?? id }));
        return id;
      },

      renameClass: (id, name) =>
        set((s) => withClass(s, id, (c) => ({ ...c, name }))),

      deleteClass: (id) =>
        set((s) => ({
          ...s,
          classes: s.classes.filter((c) => c.id !== id),
          activeClassId: s.activeClassId === id ? null : s.activeClassId,
        })),

      setActiveClass: (id) => set((s) => ({ ...s, activeClassId: id })),

      addStudents: (classId, names) =>
        set((s) =>
          withClass(s, classId, (c) => {
            const fresh: Student[] = names
              .map((n) => n.trim())
              .filter(Boolean)
              .map((name) => ({ id: uid(), name, needsFrontRow: false, keepApart: [] }));
            return { ...c, students: [...c.students, ...fresh] };
          }),
        ),

      updateStudent: (classId, studentId, patch) =>
        set((s) =>
          withClass(s, classId, (c) => ({
            ...c,
            students: c.students.map((st) => (st.id === studentId ? { ...st, ...patch } : st)),
          })),
        ),

      removeStudent: (classId, studentId) =>
        set((s) =>
          withClass(s, classId, (c) => ({
            ...c,
            students: c.students
              .filter((st) => st.id !== studentId)
              .map((st) => ({ ...st, keepApart: st.keepApart.filter((id) => id !== studentId) })),
            arrangements: c.arrangements.map((a) => {
              const next: Record<SeatId, StudentId> = {};
              for (const [seat, sid] of Object.entries(a.assignments)) {
                if (sid !== studentId) next[seat] = sid;
              }
              return { ...a, assignments: next };
            }),
          })),
        ),

      toggleKeepApart: (classId, a, b) =>
        set((s) =>
          withClass(s, classId, (c) => ({
            ...c,
            students: c.students.map((st) => {
              if (st.id === a) {
                const has = st.keepApart.includes(b);
                return { ...st, keepApart: has ? st.keepApart.filter((x) => x !== b) : [...st.keepApart, b] };
              }
              if (st.id === b) {
                const has = st.keepApart.includes(a);
                return { ...st, keepApart: has ? st.keepApart.filter((x) => x !== a) : [...st.keepApart, a] };
              }
              return st;
            }),
          })),
        ),

      addDesk: (classId, desk) =>
        set((s) => withClass(s, classId, (c) => ({ ...c, room: { ...c.room, desks: [...c.room.desks, desk] } }))),

      addDesks: (classId, desks) =>
        set((s) => withClass(s, classId, (c) => ({ ...c, room: { ...c.room, desks: [...c.room.desks, ...desks] } }))),

      updateRoom: (classId, patch) =>
        set((s) => withClass(s, classId, (c) => ({ ...c, room: { ...c.room, ...patch } }))),

      updateDesk: (classId, deskId, patch) =>
        set((s) =>
          withClass(s, classId, (c) => ({
            ...c,
            room: { ...c.room, desks: c.room.desks.map((d) => (d.id === deskId ? { ...d, ...patch } : d)) },
          })),
        ),

      removeDesks: (classId, deskIds) =>
        set((s) =>
          withClass(s, classId, (c) => {
            const remaining = c.room.desks.filter((d) => !deskIds.includes(d.id));
            const removedSeatIds = new Set(
              c.room.desks.filter((d) => deskIds.includes(d.id)).flatMap((d) => d.seats.map((seat) => seat.id)),
            );
            return {
              ...c,
              room: { ...c.room, desks: remaining },
              arrangements: c.arrangements.map((a) => {
                const next: Record<SeatId, StudentId> = {};
                for (const [seat, sid] of Object.entries(a.assignments)) {
                  if (!removedSeatIds.has(seat)) next[seat] = sid;
                }
                return { ...a, assignments: next };
              }),
            };
          }),
        ),

      setSeatFrontRow: (classId, deskId, seatId, value) =>
        set((s) =>
          withClass(s, classId, (c) => ({
            ...c,
            room: {
              ...c.room,
              desks: c.room.desks.map((d) =>
                d.id === deskId
                  ? { ...d, seats: d.seats.map((seat) => (seat.id === seatId ? { ...seat, isFrontRow: value } : seat)) }
                  : d,
              ),
            },
          })),
        ),

      setDeskFrontRow: (classId, deskId, value) =>
        set((s) =>
          withClass(s, classId, (c) => ({
            ...c,
            room: {
              ...c.room,
              desks: c.room.desks.map((d) =>
                d.id === deskId ? { ...d, seats: d.seats.map((seat) => ({ ...seat, isFrontRow: value })) } : d,
              ),
            },
          })),
        ),

      updateSeat: (classId, deskId, seatId, patch) =>
        set((s) =>
          withClass(s, classId, (c) => ({
            ...c,
            room: {
              ...c.room,
              desks: c.room.desks.map((d) =>
                d.id === deskId
                  ? { ...d, seats: d.seats.map((seat) => (seat.id === seatId ? { ...seat, ...patch } : seat)) }
                  : d,
              ),
            },
          })),
        ),

      saveArrangement: (classId, assignments, label) => {
        const id = uid();
        const arr: Arrangement = { id, createdAt: new Date().toISOString(), label, assignments: { ...assignments } };
        set((s) => withClass(s, classId, (c) => ({ ...c, arrangements: [arr, ...c.arrangements] })));
        return { id };
      },

      deleteArrangement: (classId, arrangementId) =>
        set((s) =>
          withClass(s, classId, (c) => ({
            ...c,
            arrangements: c.arrangements.filter((a) => a.id !== arrangementId),
          })),
        ),

      replaceState: (next) => set(() => ({ ...next })),
    }),
    {
      name: "seating-chart-designer:v1",
      version: SCHEMA_VERSION,
      migrate: (persisted, fromVersion) => {
        let s: unknown = persisted;
        if (fromVersion < 2) s = migrateV1toV2(s);
        if (fromVersion < 3) s = migrateV2toV3(s);
        if (fromVersion < 4) s = migrateV3toV4(s);
        return s as AppState;
      },
    },
  ),
);

export const selectClass = (id: ClassId | null) => (s: AppStore): ClassRoom | undefined =>
  id ? findClass(s, id) : undefined;

export const selectActiveClass = (s: AppStore): ClassRoom | undefined =>
  s.activeClassId ? findClass(s, s.activeClassId) : undefined;
