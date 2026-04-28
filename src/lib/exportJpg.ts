import type Konva from "konva";

export function exportStageAsJpg(stage: Konva.Stage, filename: string) {
  const dataUrl = stage.toDataURL({ mimeType: "image/jpeg", quality: 0.92, pixelRatio: 2 });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename.endsWith(".jpg") ? filename : `${filename}.jpg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
