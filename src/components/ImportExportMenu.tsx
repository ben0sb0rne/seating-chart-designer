import { useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { exportStateToFile, readStateFromFile } from "@/lib/io";
import Icon from "@/components/Icon";

export default function ImportExportMenu() {
  const fileRef = useRef<HTMLInputElement>(null);
  const exportNow = () => {
    const { classes, activeClassId, schemaVersion } = useAppStore.getState();
    exportStateToFile({ classes, activeClassId, schemaVersion });
  };

  const handleImport: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { state, warnings } = await readStateFromFile(file);
      const replace = confirm(
        `Import "${file.name}"?\n\n` +
          `${state.classes.length} class${state.classes.length === 1 ? "" : "es"}.\n\n` +
          `OK = Replace all current data.\nCancel = Merge (add to current data).` +
          (warnings.length ? `\n\nWarnings:\n- ${warnings.join("\n- ")}` : ""),
      );
      const store = useAppStore.getState();
      if (replace) {
        store.replaceState(state);
      } else {
        store.replaceState({
          classes: [...store.classes, ...state.classes],
          activeClassId: store.activeClassId ?? state.activeClassId,
          schemaVersion: store.schemaVersion,
        });
      }
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImport}
      />
      <button className="btn-secondary" onClick={() => fileRef.current?.click()}>
        <Icon name="upload" size={14} />
        Import
      </button>
      <button className="btn-secondary" onClick={exportNow}>
        <Icon name="download" size={14} />
        Export
      </button>
    </div>
  );
}
