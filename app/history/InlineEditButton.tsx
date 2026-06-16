"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/Modal";
import TaskCombobox from "@/components/TaskCombobox";
import { updateTimeEntry } from "./actions";

type Task = {
  id: string;
  name: string;
  project_id: string | null;
  project: { id: string; name: string; color: string } | null;
};

type Entry = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  note: string | null;
  task: { id: string; name: string; project_id: string | null; project: { name: string } | null } | null;
};

export default function InlineEditButton({ entry, tasks }: { entry: Entry; tasks: Task[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const start = new Date(entry.started_at);
  const end = new Date(entry.ended_at as string);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateTimeEntry(entry.id, fd);
      setOpen(false);
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-ghost btn-sm">
        Upravit
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Upravit záznam">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label className="label">Task</label>
            <TaskCombobox tasks={tasks} defaultTaskId={entry.task?.id} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label className="label">Datum</label>
              <input
                name="date"
                type="date"
                defaultValue={start.toISOString().slice(0, 10)}
                required
                className="input"
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label className="label">Od</label>
              <input
                name="start_time"
                type="time"
                defaultValue={start.toTimeString().slice(0, 5)}
                required
                className="input"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Do</label>
              <input
                name="end_time"
                type="time"
                defaultValue={end.toTimeString().slice(0, 5)}
                required
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Poznámka</label>
            <input name="note" defaultValue={entry.note ?? ""} className="input" />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.25rem" }}>
            <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">
              Zrušit
            </button>
            <button type="submit" disabled={isPending} className="btn btn-primary">
              {isPending ? "Ukládám…" : "Uložit"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
