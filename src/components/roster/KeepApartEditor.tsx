import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import type { Student } from "@/types";
import { useAppStore } from "@/store/appStore";

interface Props {
  classId: string;
  student: Student;
  students: Student[];
}

export default function KeepApartEditor({ classId, student, students }: Props) {
  const toggleKeepApart = useAppStore((s) => s.toggleKeepApart);
  const [filter, setFilter] = useState("");

  const others = students.filter((s) => s.id !== student.id);
  const filtered = others.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()));

  const labels = student.keepApart
    .map((id) => students.find((s) => s.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="btn-secondary text-left max-w-full">
          {labels.length === 0 ? (
            <span className="text-ink-muted">Add…</span>
          ) : (
            <span className="line-clamp-1">{labels.join(", ")}</span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="z-50 w-72 rounded-md border border-slate-200 bg-white p-2 shadow-lg"
        >
          <input
            className="input mb-2"
            placeholder="Filter…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            autoFocus
          />
          <div className="max-h-64 overflow-auto">
            {filtered.length === 0 ? (
              <div className="p-2 text-xs text-ink-muted">No matches.</div>
            ) : (
              filtered.map((s) => {
                const checked = student.keepApart.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleKeepApart(classId, student.id, s.id)}
                    />
                    <span className="text-sm">{s.name}</span>
                  </label>
                );
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
