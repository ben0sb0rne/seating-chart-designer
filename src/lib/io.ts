import type { AppState } from "@/types";
import { SCHEMA_VERSION } from "@/types";
import { runMigrations } from "@/lib/migrations";

export function exportStateToFile(state: AppState) {
  const payload: AppState = {
    classes: state.classes,
    activeClassId: state.activeClassId,
    schemaVersion: SCHEMA_VERSION,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `seating-chart-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ParsedImport {
  state: AppState;
  warnings: string[];
}

export async function readStateFromFile(file: File): Promise<ParsedImport> {
  const text = await file.text();
  const data = JSON.parse(text) as unknown;
  return validateAppState(data);
}

function validateAppState(raw: unknown): ParsedImport {
  const warnings: string[] = [];
  if (!raw || typeof raw !== "object") throw new Error("File is not a JSON object");
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.classes)) throw new Error("Missing 'classes' array");

  const incomingVersion = typeof obj.schemaVersion === "number" ? obj.schemaVersion : 1;
  if (incomingVersion < SCHEMA_VERSION) {
    warnings.push(
      `Imported file was schema v${incomingVersion}; upgraded to v${SCHEMA_VERSION} on the fly.`,
    );
  } else if (incomingVersion > SCHEMA_VERSION) {
    warnings.push(
      `Imported file is schema v${incomingVersion} (newer than this app's v${SCHEMA_VERSION}). Some fields may be ignored.`,
    );
  }

  // Run the same migration chain Zustand uses so imported files are normalised
  // to the current shape (e.g. older files without `furniture` get filled in).
  const state = runMigrations(obj, incomingVersion);
  return { state, warnings };
}
