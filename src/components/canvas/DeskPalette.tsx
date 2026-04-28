import { useState } from "react";
import type { DeskKind, Room, Wall } from "@/types";
import { cn } from "@/lib/cn";

interface Props {
  onPlaceSingle: (kind: DeskKind) => void;
  onOpenMulti: (kind: DeskKind) => void;
  room: Room;
  onUpdateRoom: (patch: Partial<Room>) => void;
  onRandomize: () => void;
  onSave: () => void;
  onExportJpg: () => void;
}

interface PaletteItem {
  kind: DeskKind;
  label: string;
}

const SINGLE_ITEMS: PaletteItem[] = [
  { kind: "single-rect", label: "Rectangle desk" },
  { kind: "single-triangle", label: "Triangle desk" },
  { kind: "single-circle", label: "Circle desk" },
];

const MULTI_ITEMS: PaletteItem[] = [
  { kind: "multi-rect", label: "Rectangle table" },
  { kind: "multi-square", label: "Square table" },
  { kind: "multi-circle", label: "Circle table" },
];

export default function DeskPalette({
  onPlaceSingle,
  onOpenMulti,
  room,
  onUpdateRoom,
  onRandomize,
  onSave,
  onExportJpg,
}: Props) {
  const [roomOptsOpen, setRoomOptsOpen] = useState(false);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex-1 overflow-auto p-3">
        <div className="label mb-2">Single-student</div>
        <ul className="mb-5 space-y-1">
          {SINGLE_ITEMS.map((it) => (
            <li key={it.kind}>
              <button
                className="btn-secondary w-full justify-start"
                onClick={() => onPlaceSingle(it.kind)}
                title="Click to add to room"
              >
                <ShapeIcon kind={it.kind} />
                <span className="ml-2 truncate">{it.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="label mb-2">Multi-student</div>
        <ul className="mb-5 space-y-1">
          {MULTI_ITEMS.map((it) => (
            <li key={it.kind}>
              <button
                className="btn-secondary w-full justify-start"
                onClick={() => onOpenMulti(it.kind)}
                title="Click to configure and add"
              >
                <ShapeIcon kind={it.kind} />
                <span className="ml-2 flex-1 truncate text-left">{it.label}</span>
                <span className="ml-1 text-xs text-ink-muted">…</span>
              </button>
            </li>
          ))}
        </ul>

        <button
          className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-ink-muted hover:bg-slate-100"
          onClick={() => setRoomOptsOpen((o) => !o)}
        >
          <span>Room options</span>
          <span aria-hidden>{roomOptsOpen ? "▾" : "▸"}</span>
        </button>
        {roomOptsOpen && (
          <div className="mt-2 space-y-3 rounded-md border border-slate-200 p-3">
            <div>
              <label className="label">Room size</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <NumberField
                  ariaLabel="Width"
                  value={room.width}
                  min={400}
                  max={3000}
                  step={50}
                  onChange={(v) => onUpdateRoom({ width: v })}
                />
                <NumberField
                  ariaLabel="Height"
                  value={room.height}
                  min={400}
                  max={3000}
                  step={50}
                  onChange={(v) => onUpdateRoom({ height: v })}
                />
              </div>
              <p className="mt-1 text-[10px] text-ink-muted">Width × height of the room area.</p>
            </div>
            <div>
              <label className="label">Front of room</label>
              <div className="mt-1 grid grid-cols-2 gap-1">
                {(["top", "right", "bottom", "left"] as Wall[]).map((wall) => (
                  <button
                    key={wall}
                    className={cn(
                      "rounded-md border px-2 py-1 text-xs capitalize",
                      room.frontWall === wall
                        ? "border-ink bg-ink text-white"
                        : "border-slate-300 bg-white text-ink hover:bg-slate-50",
                    )}
                    onClick={() => onUpdateRoom({ frontWall: wall })}
                  >
                    {wall}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-2 border-t border-slate-200 p-3">
        <button className="btn-primary w-full" onClick={onRandomize}>Randomize seating</button>
        <button className="btn-secondary w-full" onClick={onSave}>Save this arrangement</button>
        <button className="btn-secondary w-full" onClick={onExportJpg}>Export JPG</button>
      </div>
    </aside>
  );
}

function NumberField({
  ariaLabel,
  value,
  min,
  max,
  step,
  onChange,
}: {
  ariaLabel: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <input
      type="number"
      className="input"
      aria-label={ariaLabel}
      value={value}
      min={min}
      max={max}
      step={step ?? 1}
      onChange={(e) => {
        const next = Math.max(min, Math.min(max, Number(e.target.value) || min));
        onChange(next);
      }}
    />
  );
}

function ShapeIcon({ kind }: { kind: DeskKind }) {
  const stroke = "#475569";
  const fill = "#e2e8f0";
  const size = 18;
  switch (kind) {
    case "single-rect":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
          <rect x="4" y="6" width="12" height="8" fill={fill} stroke={stroke} rx="1" />
        </svg>
      );
    case "single-triangle":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
          <polygon points="10,3 17,16 3,16" fill={fill} stroke={stroke} strokeLinejoin="round" />
        </svg>
      );
    case "single-circle":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
          <circle cx="10" cy="10" r="6" fill={fill} stroke={stroke} />
        </svg>
      );
    case "multi-rect":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
          <rect x="2" y="6" width="16" height="8" fill={fill} stroke={stroke} rx="1" />
          <circle cx="6" cy="9" r="1" fill="#fff" stroke={stroke} />
          <circle cx="10" cy="9" r="1" fill="#fff" stroke={stroke} />
          <circle cx="14" cy="9" r="1" fill="#fff" stroke={stroke} />
          <circle cx="6" cy="12" r="1" fill="#fff" stroke={stroke} />
          <circle cx="10" cy="12" r="1" fill="#fff" stroke={stroke} />
          <circle cx="14" cy="12" r="1" fill="#fff" stroke={stroke} />
        </svg>
      );
    case "multi-square":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
          <rect x="4" y="4" width="12" height="12" fill={fill} stroke={stroke} rx="1" />
          <circle cx="10" cy="5" r="1" fill="#fff" stroke={stroke} />
          <circle cx="15" cy="10" r="1" fill="#fff" stroke={stroke} />
          <circle cx="10" cy="15" r="1" fill="#fff" stroke={stroke} />
          <circle cx="5" cy="10" r="1" fill="#fff" stroke={stroke} />
        </svg>
      );
    case "multi-circle":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
          <circle cx="10" cy="10" r="6" fill={fill} stroke={stroke} />
          <circle cx="10" cy="5" r="1" fill="#fff" stroke={stroke} />
          <circle cx="14" cy="10" r="1" fill="#fff" stroke={stroke} />
          <circle cx="10" cy="15" r="1" fill="#fff" stroke={stroke} />
          <circle cx="6" cy="10" r="1" fill="#fff" stroke={stroke} />
        </svg>
      );
  }
}
