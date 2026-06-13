"use client";

import { useEffect, useState } from "react";
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
  const [pending, setPending] = useState(false);

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
      <div className="rounded border p-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Běží</div>
          <div className="font-semibold">
            {running.task?.project ? `${running.task.project.name} / ` : ""}
            {running.task?.name}
          </div>
          <div className="text-2xl font-mono">{formatElapsed(elapsed)}</div>
        </div>
        <button
          disabled={pending}
          onClick={async () => {
            setPending(true);
            await stopTimer(running.id);
            setPending(false);
          }}
          className="rounded bg-red-600 text-white px-4 py-2 disabled:opacity-50"
        >
          Stop
        </button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded border p-4 text-sm text-gray-500">
        Nejdřív vytvoř nějaký task na stránce Tasky.
      </div>
    );
  }

  return (
    <div className="rounded border p-4 flex items-center gap-2">
      <select
        value={selectedTask}
        onChange={(e) => setSelectedTask(e.target.value)}
        className="border rounded px-2 py-1 flex-1"
      >
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.project ? `${t.project.name} / ` : ""}
            {t.name}
          </option>
        ))}
      </select>
      <button
        disabled={pending || !selectedTask}
        onClick={async () => {
          setPending(true);
          await startTimer(selectedTask);
          setPending(false);
        }}
        className="rounded bg-green-600 text-white px-4 py-2 disabled:opacity-50"
      >
        Start
      </button>
    </div>
  );
}
