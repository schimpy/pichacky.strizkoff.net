"use client";

import { useState, useTransition } from "react";
import Modal from "./Modal";
import { updateTask } from "@/app/tasks/actions";

type Project = { id: string; name: string; color: string };
type Tag = { id: string; name: string };
type Task = { id: string; name: string; project_id: string | null; recurring: boolean };

export default function EditTaskModal({
  task,
  projects,
  tags,
  currentTagIds,
}: {
  task: Task;
  projects: Project[];
  tags: Tag[];
  currentTagIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateTask(task.id, fd);
      setOpen(false);
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-ghost btn-sm">
        Upravit
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Upravit task">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label className="label">Název</label>
            <input name="name" defaultValue={task.name} required className="input" autoFocus />
          </div>
          <div>
            <label className="label">Projekt</label>
            <select name="project_id" defaultValue={task.project_id ?? ""} className="select">
              <option value="">Bez projektu</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          {tags.length > 0 && (
            <div>
              <label className="label">Tagy (Ctrl+klik pro více)</label>
              <select name="tag_ids" multiple className="select" defaultValue={currentTagIds} style={{ height: "6rem" }}>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
            <input name="recurring" type="checkbox" defaultChecked={task.recurring} style={{ width: "1rem", height: "1rem" }} />
            Opakující se task (rychlý přístup na dashboardu)
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
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
