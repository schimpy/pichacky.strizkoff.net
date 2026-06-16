"use client";

import { useState, useTransition } from "react";
import Modal from "./Modal";
import { updateProject } from "@/app/tasks/actions";

type Project = { id: string; name: string; color: string };

export default function EditProjectModal({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateProject(project.id, fd);
      setOpen(false);
    });
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-ghost btn-sm">
        Upravit
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Upravit projekt">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label className="label">Název</label>
            <input name="name" defaultValue={project.name} required className="input" autoFocus />
          </div>
          <div>
            <label className="label">Barva</label>
            <input
              name="color"
              type="color"
              defaultValue={project.color}
              className="input"
              style={{ height: "2.5rem", padding: "0.2rem 0.4rem", cursor: "pointer" }}
            />
          </div>
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
