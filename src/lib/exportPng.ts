import type Konva from "konva";

/**
 * Export the Konva stage as a PNG with a transparent background. Temporarily
 * clears the room-background rect's fill so the area outside the desks is
 * see-through. Stage strokes (room outline, front-of-room dashes) and per-desk
 * fills are preserved.
 */
export function exportStageAsPng(stage: Konva.Stage, filename: string) {
  const roomBg = stage.findOne("#room-bg") as Konva.Rect | null;
  const originalFill = roomBg?.fill();

  if (roomBg) {
    roomBg.fill("rgba(0,0,0,0)");
    roomBg.getLayer()?.batchDraw();
  }

  try {
    const dataUrl = stage.toDataURL({
      mimeType: "image/png",
      pixelRatio: 2,
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
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
