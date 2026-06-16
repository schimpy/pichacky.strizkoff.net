"use client";

import { useEffect, useState, useTransition } from "react";
import { startTimer, stopTimer } from "@/app/timer/actions";

type ProjectRef = { name: string; color: string } | null;

type Task = {
  id: string;
  name: string;
  project: ProjectRef;
};

type RunningEntry = {
  id: string;
  started_at: string;
  task: { id: string; name: string; project: ProjectRef } | null;
} | null;

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => n.toString().padStart(2, "0")).join(":");
}

export default function TimerWidget({
  tasks,
  running,
}: {
  tasks: Task[];
  running: RunningEntry;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [selectedTask, setSelectedTask] = useState(tasks[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!running) return;
    const start = new Date(running.started_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [running]);

  if (running) {
    return (
      <div
        className="card card-pad"
        style={{
          background: "linear-gradient(135deg, #4f46e5, #6366f1)",
          color: "#fff",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.8rem",
              opacity: 0.85,
            }}
          >
            <span className="pulse-dot" />
            Probíhá
          </div>
          <div style={{ fontWeight: 600, fontSize: "1.05rem", marginTop: "0.2rem" }}>
            {running.task?.project ? `${running.task.project.name} · ` : ""}
            {running.task?.name}
          </div>
          <div
            style={{
              fontSize: "2.25rem",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.02em",
              marginTop: "0.2rem",
            }}
          >
            {formatElapsed(elapsed)}
          </div>
        </div>
        <button
          className="btn btn-lg"
          style={{ background: "#fff", color: "var(--brand)" }}
          disabled={isPending}
          onClick={() => startTransition(() => stopTimer(running.id))}
        >
          {isPending ? "Zastavuji…" : "■ Stop"}
        </button>
        <style>{`
          .pulse-dot {
            width: 0.55rem; height: 0.55rem; border-radius: 9999px; background: #fff;
            animation: pulse 1.4s ease-in-out infinite;
          }
          @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        `}</style>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="card card-pad muted">
        Nejdřív si vytvoř task na stránce{" "}
        <a href="/tasks" style={{ color: "var(--brand)", fontWeight: 500 }}>
          Tasky
        </a>
        , pak můžeš spustit časovač.
      </div>
    );
  }

  return (
    <div
      className="card card-pad"
      style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}
    >
      <div style={{ flex: 1, minWidth: "12rem" }}>
        <label className="label">Na čem pracuješ?</label>
        <select
          className="select"
          value={selectedTask}
          onChange={(e) => setSelectedTask(e.target.value)}
        >
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.project ? `${t.project.name} · ` : ""}
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <button
        className="btn btn-primary btn-lg"
        disabled={isPending || !selectedTask}
        onClick={() => startTransition(() => startTimer(selectedTask))}
      >
        {isPending ? "Spouštím…" : "▶ Start"}
      </button>
    </div>
  );
}
