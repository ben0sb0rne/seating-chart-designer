import { useNavigate, useParams } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import type { Arrangement, ClassRoom, Desk } from "@/types";

export default function History() {
  const { id } = useParams();
  const navigate = useNavigate();
  const klass = useAppStore((s) => (id ? s.classes.find((c) => c.id === id) : undefined));
  const deleteArrangement = useAppStore((s) => s.deleteArrangement);

  if (!klass) return <div className="p-6 text-ink-muted">Class not found.</div>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-1 text-xl font-bold">History · {klass.name}</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Previous seating arrangements. Restore one to reload it on the room canvas.
      </p>
      {klass.arrangements.length === 0 ? (
        <div className="card p-8 text-center text-ink-muted">
          No arrangements saved yet. Use Randomize on the room screen, then click Save.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {klass.arrangements.map((arr) => (
            <li key={arr.id} className="card overflow-hidden">
              <div className="aspect-[4/3] bg-slate-50">
                <Thumbnail klass={klass} arrangement={arr} />
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium">{arr.label || "(untitled)"}</div>
                    <div className="text-xs text-ink-muted">{new Date(arr.createdAt).toLocaleString()}</div>
                    <div className="text-xs text-ink-muted">
                      {Object.keys(arr.assignments).length} students seated
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        sessionStorage.setItem(`restore:${klass.id}`, arr.id);
                        navigate(`/classes/${klass.id}/room`);
                      }}
                    >
                      Restore
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => {
                        if (confirm("Delete this arrangement?")) deleteArrangement(klass.id, arr.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Thumbnail({ klass, arrangement }: { klass: ClassRoom; arrangement: Arrangement }) {
  const w = klass.room.width;
  const h = klass.room.height;
  const frontWall = klass.room.frontWall ?? "top";
  const frontLine =
    frontWall === "top" ? { x1: 0, y1: 0, x2: w, y2: 0 } :
    frontWall === "right" ? { x1: w, y1: 0, x2: w, y2: h } :
    frontWall === "bottom" ? { x1: 0, y1: h, x2: w, y2: h } :
    { x1: 0, y1: 0, x2: 0, y2: h };
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
      <rect x={0} y={0} width={w} height={h} fill="#fafaf7" />
      <line {...frontLine} stroke="#0f172a" strokeWidth={6} strokeDasharray="14 8" />
      {klass.room.desks.map((desk) => {
        const transform = `translate(${desk.x} ${desk.y}) rotate(${desk.rotation} ${desk.width / 2} ${desk.height / 2})`;
        return (
          <g key={desk.id} transform={transform}>
            <DeskOutline desk={desk} />
            {desk.seats.map((seat) => {
              const studentId = arrangement.assignments[seat.id];
              const occupied = !!studentId;
              return (
                <circle
                  key={seat.id}
                  cx={seat.offsetX}
                  cy={seat.offsetY}
                  r={10}
                  fill={occupied ? "#0284c7" : "#ffffff"}
                  stroke="#94a3b8"
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function DeskOutline({ desk }: { desk: Desk }) {
  switch (desk.kind) {
    case "single-rect":
    case "multi-rect":
    case "multi-square":
      return (
        <rect x={0} y={0} width={desk.width} height={desk.height} fill="#f1f5f9" stroke="#475569" rx={4} />
      );
    case "multi-circle":
      return (
        <circle cx={desk.width / 2} cy={desk.height / 2} r={desk.width / 2} fill="#f1f5f9" stroke="#475569" />
      );
    case "single-triangle": {
      const apexX = desk.width / 2;
      const apexY = 0;
      const baseLeftX = 0;
      const baseRightX = desk.width;
      const baseY = desk.height;
      return (
        <polygon
          points={`${apexX},${apexY} ${baseRightX},${baseY} ${baseLeftX},${baseY}`}
          fill="#f1f5f9"
          stroke="#475569"
          strokeLinejoin="round"
        />
      );
    }
  }
}
