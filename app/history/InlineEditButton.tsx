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

export default function InlineEditButton({
  entryId,
  taskId,
  defaultDate,
  defaultStart,
  defaultEnd,
  defaultNote,
  tasks,
}: {
  entryId: string;
  taskId?: string;
  defaultDate: string;
  defaultStart: string;
  defaultEnd: string;
  defaultNote: string;
  tasks: Task[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateTimeEntry(entryId, fd);
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
            <TaskCombobox tasks={tasks} defaultTaskId={taskId} />
          </div>
          <div>
            <label className="label">Datum</label>
            <input name="date" type="date" defaultValue={defaultDate} required className="input" />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ flex: 1 }}>
              <label className="label">Od</label>
              <input name="start_time" type="time" defaultValue={defaultStart} required className="input" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Do</label>
              <input name="end_time" type="time" defaultValue={defaultEnd} required className="input" />
            </div>
          </div>
          <div>
            <label className="label">Poznámka</label>
            <input name="note" defaultValue={defaultNote} className="input" />
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
