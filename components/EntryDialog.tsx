"use client";

import { useRef, useTransition } from "react";

type Task = {
  id: string;
  name: string;
  project: { name: string } | null;
};

type EntryDefaults = {
  task_id: string;
  date: string;
  start_time: string;
  end_time: string;
  note: string;
};

export default function EntryDialog({
  mode,
  tasks,
  defaults,
  saveAction,
  deleteAction,
  triggerClassName,
  triggerLabel,
}: {
  mode: "new" | "edit";
  tasks: Task[];
  defaults?: EntryDefaults;
  saveAction: (formData: FormData) => Promise<void>;
  deleteAction?: () => Promise<void>;
  triggerClassName: string;
  triggerLabel: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function save(formData: FormData) {
    startTransition(async () => {
      await saveAction(formData);
      ref.current?.close();
    });
  }

  function remove() {
    if (!deleteAction) return;
    startDelete(async () => {
      await deleteAction();
      ref.current?.close();
    });
  }

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => ref.current?.showModal()}>
        {triggerLabel}
      </button>
      <dialog ref={ref}>
        <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.1rem" }}>{mode === "new" ? "Nový záznam" : "Upravit záznam"}</h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1.25rem", color: "var(--muted)" }}
            >
              ×
            </button>
          </div>
          <form action={save} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <div>
              <label className="label">Task</label>
              <select name="task_id" required defaultValue={defaults?.task_id} className="select">
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.project ? `${t.project.name} · ` : ""}
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Datum</label>
              <input type="date" name="date" required defaultValue={defaults?.date} className="input" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label className="label">Od</label>
                <input type="time" name="start_time" required defaultValue={defaults?.start_time} className="input" />
              </div>
              <div>
                <label className="label">Do</label>
                <input type="time" name="end_time" required defaultValue={defaults?.end_time} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Poznámka</label>
              <input name="note" defaultValue={defaults?.note} placeholder="Volitelné" className="input" />
            </div>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between", marginTop: "0.25rem" }}>
              {deleteAction ? (
                <button type="button" className="btn btn-ghost" style={{ color: "var(--danger)" }} disabled={isDeleting} onClick={remove}>
                  {isDeleting ? "Mažu…" : "Smazat"}
                </button>
              ) : (
                <span />
              )}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button type="button" className="btn btn-ghost" onClick={() => ref.current?.close()}>
                  Zrušit
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Ukládám…" : "Uložit"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
