"use client";

import { useTransition } from "react";
import { startTimer } from "@/app/timer/actions";

type Task = { id: string; name: string; project: { name: string; color: string } | null };

export default function QuickStart({ tasks }: { tasks: Task[] }) {
  const [isPending, startTransition] = useTransition();

  if (tasks.length === 0) return null;

  return (
    <div>
      <p className="label" style={{ marginBottom: "0.5rem" }}>🔁 Rychlé spuštění</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {tasks.map((t) => (
          <button
            key={t.id}
            disabled={isPending}
            onClick={() => startTransition(() => startTimer(t.id))}
            className="btn btn-ghost"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            {t.project && <span className="dot" style={{ background: t.project.color }} />}
            {t.project ? `${t.project.name} / ` : ""}{t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
