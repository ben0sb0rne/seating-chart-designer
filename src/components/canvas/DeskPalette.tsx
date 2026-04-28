import type { DeskKind } from "@/types";

interface Props {
  onPlaceSingle: (kind: DeskKind) => void;
  onOpenMulti: (kind: DeskKind) => void;
}

interface PaletteItem {
  kind: DeskKind;
  label: string;
  multi: boolean;
}

const SINGLE_ITEMS: PaletteItem[] = [
  { kind: "single-rect", label: "Rectangle desk", multi: false },
  { kind: "single-triangle", label: "Triangle desk", multi: false },
  { kind: "single-circle", label: "Circle desk", multi: false },
];

const MULTI_ITEMS: PaletteItem[] = [
  { kind: "multi-rect", label: "Rectangle table", multi: true },
  { kind: "multi-square", label: "Square table", multi: true },
  { kind: "multi-circle", label: "Circle table", multi: true },
];

export default function DeskPalette({ onPlaceSingle, onOpenMulti }: Props) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
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
        <ul className="space-y-1">
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
      </div>
      <div className="border-t border-slate-200 p-3 text-xs text-ink-muted">
        Single-student desks drop directly. Multi-student tables ask for parameters first. Drag any desk to reposition; rotate via the handle. Press Delete to remove.
      </div>
    </aside>
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
