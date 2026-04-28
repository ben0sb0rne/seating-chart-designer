import * as Dialog from "@radix-ui/react-dialog";
import Icon from "@/components/Icon";

interface ShortcutGroup {
  title: string;
  rows: { keys: string[]; label: string }[];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: "Selection",
    rows: [
      { keys: ["Click"], label: "Select an item" },
      { keys: ["Shift", "+", "Click"], label: "Add or remove from selection" },
      { keys: ["Drag on empty area"], label: "Marquee-select multiple items" },
      { keys: ["Ctrl", "+", "A"], label: "Select all desks and furniture" },
      { keys: ["Esc"], label: "Clear selection" },
    ],
  },
  {
    title: "Editing",
    rows: [
      { keys: ["Drag"], label: "Move a selected item" },
      { keys: ["Drag corner"], label: "Resize a selected item" },
      { keys: ["Drag rotation handle"], label: "Rotate (snaps every 45°)" },
      { keys: ["Right-click desk"], label: "Toggle front-row for that desk" },
      { keys: ["Right-click seat"], label: "Toggle front-row for that seat" },
      { keys: ["Click seat"], label: "Assign a student" },
      { keys: ["Delete"], label: "Remove selected items" },
      { keys: ["Ctrl", "+", "C"], label: "Copy selected items" },
      { keys: ["Ctrl", "+", "V"], label: "Paste at offset" },
      { keys: ["Ctrl", "+", "D"], label: "Duplicate selected items" },
    ],
  },
  {
    title: "App",
    rows: [
      { keys: ["Ctrl", "+", "Z"], label: "Undo" },
      { keys: ["Ctrl", "+", "Shift", "+", "Z"], label: "Redo" },
    ],
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HelpDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl focus:outline-none">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold">Keyboard shortcuts</Dialog.Title>
              <Dialog.Description className="text-sm text-ink-muted">
                Quick reference for the room canvas and global app commands.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="rounded p-1 text-ink-muted hover:bg-slate-100 hover:text-ink"
                aria-label="Close"
              >
                <Icon name="x" size={16} />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-5">
            {GROUPS.map((group) => (
              <section key={group.title}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {group.rows.map((row, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-4 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                    >
                      <span className="text-ink-muted">{row.label}</span>
                      <span className="flex items-center gap-1">
                        {row.keys.map((k, j) =>
                          k === "+" ? (
                            <span key={j} className="text-ink-muted">+</span>
                          ) : (
                            <kbd
                              key={j}
                              className="inline-block min-w-[28px] rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-center text-xs font-mono font-medium text-ink shadow-sm"
                            >
                              {k}
                            </kbd>
                          ),
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <p className="mt-5 text-[11px] text-ink-muted">
            On macOS, ⌘ works the same as Ctrl.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
