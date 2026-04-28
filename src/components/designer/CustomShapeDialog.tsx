import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { DeskShape, DeskShapeKind } from "@/types";
import { useAppStore } from "@/store/appStore";
import { layoutSeats } from "@/lib/shapes";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CustomShapeDialog({ open, onOpenChange }: Props) {
  const addCustomShape = useAppStore((s) => s.addCustomShape);
  const [kind, setKind] = useState<DeskShapeKind>("rect");
  const [name, setName] = useState("");
  const [width, setWidth] = useState(140);
  const [height, setHeight] = useState(80);
  const [diameter, setDiameter] = useState(120);
  const [seatCount, setSeatCount] = useState(4);

  function reset() {
    setKind("rect"); setName(""); setWidth(140); setHeight(80); setDiameter(120); setSeatCount(4);
  }

  const previewShape: DeskShape = useMemo(
    () =>
      kind === "rect"
        ? { id: "preview", name: "preview", kind, width, height, seatCount, builtIn: false }
        : { id: "preview", name: "preview", kind, width: diameter, height: diameter, seatCount, builtIn: false },
    [kind, width, height, diameter, seatCount],
  );

  const previewSeats = useMemo(() => layoutSeats(previewShape), [previewShape]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      alert("Please give the shape a name.");
      return;
    }
    const shape: DeskShape =
      kind === "rect"
        ? { id: crypto.randomUUID(), name: trimmed, kind, width, height, seatCount, builtIn: false }
        : { id: crypto.randomUUID(), name: trimmed, kind, width: diameter, height: diameter, seatCount, builtIn: false };
    addCustomShape(shape);
    reset();
    onOpenChange(false);
  }

  const previewBox = kind === "rect" ? { w: width, h: height } : { w: diameter, h: diameter };
  const previewScale = Math.min(220 / previewBox.w, 220 / previewBox.h);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="mb-1 text-lg font-semibold">Design a custom desk shape</Dialog.Title>
          <Dialog.Description className="mb-4 text-sm text-ink-muted">
            Choose a rectangle or circle and the number of seats. Seat positions can be tweaked later on the canvas.
          </Dialog.Description>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="label">Shape</label>
                <div className="mt-1 flex gap-2">
                  <button
                    className={kind === "rect" ? "btn-primary flex-1" : "btn-secondary flex-1"}
                    onClick={() => setKind("rect")}
                  >
                    Rectangle
                  </button>
                  <button
                    className={kind === "circle" ? "btn-primary flex-1" : "btn-secondary flex-1"}
                    onClick={() => setKind("circle")}
                  >
                    Circle
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Name</label>
                <input
                  className="input mt-1"
                  placeholder={kind === "rect" ? "e.g. Lab bench" : "e.g. Hex pod"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {kind === "rect" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Width</label>
                    <input
                      type="number"
                      className="input mt-1"
                      value={width}
                      min={40}
                      max={500}
                      onChange={(e) => setWidth(Math.max(40, Number(e.target.value) || 40))}
                    />
                  </div>
                  <div>
                    <label className="label">Height</label>
                    <input
                      type="number"
                      className="input mt-1"
                      value={height}
                      min={40}
                      max={500}
                      onChange={(e) => setHeight(Math.max(40, Number(e.target.value) || 40))}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="label">Diameter</label>
                  <input
                    type="number"
                    className="input mt-1"
                    value={diameter}
                    min={60}
                    max={500}
                    onChange={(e) => setDiameter(Math.max(60, Number(e.target.value) || 60))}
                  />
                </div>
              )}

              <div>
                <label className="label">Number of seats</label>
                <input
                  type="number"
                  className="input mt-1"
                  value={seatCount}
                  min={1}
                  max={20}
                  onChange={(e) => setSeatCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                />
              </div>
            </div>

            <div>
              <label className="label">Preview</label>
              <div className="mt-1 flex h-56 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                <svg
                  width={previewBox.w * previewScale}
                  height={previewBox.h * previewScale}
                  viewBox={`0 0 ${previewBox.w} ${previewBox.h}`}
                >
                  {kind === "rect" ? (
                    <rect x={0} y={0} width={previewBox.w} height={previewBox.h} fill="#f1f5f9" stroke="#475569" rx={4} />
                  ) : (
                    <circle cx={previewBox.w / 2} cy={previewBox.w / 2} r={previewBox.w / 2} fill="#f1f5f9" stroke="#475569" />
                  )}
                  {previewSeats.map((s) => (
                    <circle key={s.id} cx={s.offsetX} cy={s.offsetY} r={8} fill="#ffffff" stroke="#94a3b8" />
                  ))}
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="btn-secondary">Cancel</button>
            </Dialog.Close>
            <button className="btn-primary" onClick={handleSave}>Save shape</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
