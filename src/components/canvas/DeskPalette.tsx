import type { DeskShape } from "@/types";
import { useAppStore } from "@/store/appStore";

interface Props {
  shapes: DeskShape[];
  onPlace: (shapeId: string) => void;
  onCreateCustom: () => void;
}

export default function DeskPalette({ shapes, onPlace, onCreateCustom }: Props) {
  const removeCustomShape = useAppStore((s) => s.removeCustomShape);
  const builtIns = shapes.filter((s) => s.builtIn);
  const customs = shapes.filter((s) => !s.builtIn);

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-3">
        <button className="btn-primary w-full" onClick={onCreateCustom}>
          + Design custom shape
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <div className="label mb-2">Built-in</div>
        <ul className="mb-4 space-y-1">
          {builtIns.map((sh) => (
            <li key={sh.id}>
              <button
                className="btn-secondary w-full justify-start"
                onClick={() => onPlace(sh.id)}
                title="Click to add to room"
              >
                <ShapePreview shape={sh} />
                <span className="ml-2 truncate">{sh.name}</span>
              </button>
            </li>
          ))}
        </ul>
        {customs.length > 0 && (
          <>
            <div className="label mb-2">Your shapes</div>
            <ul className="space-y-1">
              {customs.map((sh) => (
                <li key={sh.id} className="flex items-center gap-1">
                  <button
                    className="btn-secondary flex-1 justify-start"
                    onClick={() => onPlace(sh.id)}
                  >
                    <ShapePreview shape={sh} />
                    <span className="ml-2 truncate">{sh.name}</span>
                  </button>
                  <button
                    className="btn-secondary px-2 text-xs"
                    onClick={() => {
                      if (confirm(`Delete shape "${sh.name}"?`)) removeCustomShape(sh.id);
                    }}
                    title="Delete shape"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className="border-t border-slate-200 p-3 text-xs text-ink-muted">
        Click a shape to drop it into the room. Drag to position; rotate via the handle. Press Delete to remove.
      </div>
    </aside>
  );
}

function ShapePreview({ shape }: { shape: DeskShape }) {
  const size = 18;
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center" aria-hidden>
      {shape.kind === "circle" ? (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="#e2e8f0" stroke="#475569" />
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 20 20">
          <rect
            x="2"
            y={shape.height < shape.width ? 6 : 2}
            width="16"
            height={shape.height < shape.width ? 8 : 16}
            fill="#e2e8f0"
            stroke="#475569"
            rx="1"
          />
        </svg>
      )}
    </span>
  );
}
