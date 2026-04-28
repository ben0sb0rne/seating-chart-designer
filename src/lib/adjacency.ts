import type { Desk, Room, Seat, SeatId } from "@/types";

export const ADJACENCY_DISTANCE = 90; // px ~ "neighboring desk" radius

export interface SeatRef {
  seatId: SeatId;
  deskId: string;
  x: number;          // world coords
  y: number;
  isFrontRow: boolean;
}

/** Convert all seats in the room into world-space references. */
export function roomSeats(room: Room): SeatRef[] {
  const out: SeatRef[] = [];
  for (const desk of room.desks) {
    for (const seat of desk.seats) {
      const { x, y } = transformSeat(desk, seat);
      out.push({ seatId: seat.id, deskId: desk.id, x, y, isFrontRow: seat.isFrontRow });
    }
  }
  return out;
}

export function transformSeat(desk: Desk, seat: Seat): { x: number; y: number } {
  const cos = Math.cos((desk.rotation * Math.PI) / 180);
  const sin = Math.sin((desk.rotation * Math.PI) / 180);
  return {
    x: desk.x + seat.offsetX * cos - seat.offsetY * sin,
    y: desk.y + seat.offsetX * sin + seat.offsetY * cos,
  };
}

/** Build the set of unordered adjacent seat-pairs for the current room. */
export function adjacencyPairs(room: Room, distance = ADJACENCY_DISTANCE): Array<[SeatId, SeatId]> {
  const seats = roomSeats(room);
  const seatsByDesk = new Map<string, SeatRef[]>();
  for (const s of seats) {
    const arr = seatsByDesk.get(s.deskId) ?? [];
    arr.push(s);
    seatsByDesk.set(s.deskId, arr);
  }

  const pairs: Array<[SeatId, SeatId]> = [];
  const seen = new Set<string>();

  // 1. Same-desk seats are always adjacent (multi-seat desks).
  for (const arr of seatsByDesk.values()) {
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const key = pairKey(arr[i].seatId, arr[j].seatId);
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push([arr[i].seatId, arr[j].seatId]);
        }
      }
    }
  }

  // 2. Cross-desk seats within distance threshold.
  for (let i = 0; i < seats.length; i++) {
    for (let j = i + 1; j < seats.length; j++) {
      const a = seats[i];
      const b = seats[j];
      if (a.deskId === b.deskId) continue;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      if (dx * dx + dy * dy <= distance * distance) {
        const key = pairKey(a.seatId, b.seatId);
        if (!seen.has(key)) {
          seen.add(key);
          pairs.push([a.seatId, b.seatId]);
        }
      }
    }
  }

  return pairs;
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}
