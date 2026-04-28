import type { AppState } from "@/types";
import { SCHEMA_VERSION } from "@/types";

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
  const version = obj.schemaVersion;
  if (version !== SCHEMA_VERSION) {
    warnings.push(`Schema version ${version} differs from current (${SCHEMA_VERSION}); attempting to load anyway.`);
  }
  if (!Array.isArray(obj.classes)) throw new Error("Missing 'classes' array");
  const state: AppState = {
    classes: obj.classes as AppState["classes"],
    activeClassId: typeof obj.activeClassId === "string" ? obj.activeClassId : null,
    schemaVersion: SCHEMA_VERSION,
  };
  return { state, warnings };
}
