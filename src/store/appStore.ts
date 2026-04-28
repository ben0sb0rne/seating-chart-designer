import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppState,
  Arrangement,
  ClassId,
  ClassRoom,
  Desk,
  DeskId,
  DeskShape,
  Room,
  Seat,
  SeatId,
  Student,
  StudentId,
} from "@/types";
import { SCHEMA_VERSION } from "@/types";

const uid = () => crypto.randomUUID();

const DEFAULT_ROOM = (): Room => ({ width: 1000, height: 700, desks: [] });

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
  updateDesk: (classId: ClassId, deskId: DeskId, patch: Partial<Desk>) => void;
  removeDesks: (classId: ClassId, deskIds: DeskId[]) => void;
  setSeatFrontRow: (classId: ClassId, deskId: DeskId, seatId: SeatId, value: boolean) => void;
  setDeskFrontRow: (classId: ClassId, deskId: DeskId, value: boolean) => void;
  updateSeat: (classId: ClassId, deskId: DeskId, seatId: SeatId, patch: Partial<Seat>) => void;

  // Custom shapes
  addCustomShape: (shape: DeskShape) => void;
  removeCustomShape: (shapeId: string) => void;

  // Arrangements
  saveArrangement: (classId: ClassId, assignments: Record<SeatId, StudentId>, label?: string) => ArrangementResult;
  deleteArrangement: (classId: ClassId, arrangementId: string) => void;

  // Bulk
  replaceState: (next: AppState) => void;
}

interface ArrangementResult {
  id: string;
}

export type AppStore = AppState & AppActions;

function findClass(state: AppState, id: ClassId): ClassRoom | undefined {
  return state.classes.find((c) => c.id === id);
}

function withClass(state: AppState, id: ClassId, mutate: (c: ClassRoom) => ClassRoom): AppState {
  return { ...state, classes: state.classes.map((c) => (c.id === id ? mutate(c) : c)) };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      classes: [],
      customShapes: [],
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

      addCustomShape: (shape) => set((s) => ({ ...s, customShapes: [...s.customShapes, shape] })),

      removeCustomShape: (shapeId) =>
        set((s) => ({ ...s, customShapes: s.customShapes.filter((sh) => sh.id !== shapeId) })),

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
    },
  ),
);

// Selector helpers
export const selectClass = (id: ClassId | null) => (s: AppStore): ClassRoom | undefined =>
  id ? findClass(s, id) : undefined;

export const selectActiveClass = (s: AppStore): ClassRoom | undefined =>
  s.activeClassId ? findClass(s, s.activeClassId) : undefined;
