import type Konva from "konva";

export type ExportMode = "transparent" | "print";

/**
 * Export the Konva stage as a PNG.
 *
 * - `transparent` (default): clears the room background fill so the area
 *   outside desks is see-through. Stroke and per-desk fills stay.
 * - `print`: forces a solid white room background instead, so the result
 *   prints cleanly on paper. Other items are unchanged.
 */
export function exportStageAsPng(
  stage: Konva.Stage,
  filename: string,
  mode: ExportMode = "transparent",
) {
  const roomBg = stage.findOne("#room-bg") as Konva.Rect | null;
  const originalFill = roomBg?.fill();

  if (roomBg) {
    if (mode === "transparent") roomBg.fill("rgba(0,0,0,0)");
    else roomBg.fill("#ffffff");
    roomBg.getLayer()?.batchDraw();
  }

  try {
    const dataUrl = stage.toDataURL({
      mimeType: "image/png",
      pixelRatio: 2,
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    const suffix = mode === "print" ? "_print" : "";
    const final = filename.endsWith(".png") ? filename : `${filename}${suffix}.png`;
    a.download = final;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    if (roomBg) {
      roomBg.fill(originalFill ?? "#fafaf7");
      roomBg.getLayer()?.batchDraw();
    }
  }
}
