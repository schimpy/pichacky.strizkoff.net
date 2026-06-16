import { pragueDayKey } from "./time";

export function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

type DayEntry = { started_at: string; duration_seconds: number | null };
type ProjectEntry = {
  duration_seconds: number | null;
  task: { project: { name: string; color: string } | null } | null;
};
type TaskEntry = {
  duration_seconds: number | null;
  task: { name: string; project: { name: string; color: string } | null } | null;
};

export function groupByDay(entries: DayEntry[]) {
  const map = new Map<string, number>();
  for (const e of entries) {
    const day = pragueDayKey(e.started_at);
    map.set(day, (map.get(day) ?? 0) + (e.duration_seconds ?? 0));
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function groupByProject(entries: ProjectEntry[]) {
  const map = new Map<string, { seconds: number; color: string }>();
  for (const e of entries) {
    const name = e.task?.project?.name ?? "Bez projektu";
    const color = e.task?.project?.color ?? "#94a3b8";
    const existing = map.get(name);
    map.set(name, { seconds: (existing?.seconds ?? 0) + (e.duration_seconds ?? 0), color });
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.seconds - a.seconds);
}

export function groupByTask(entries: TaskEntry[]) {
  const map = new Map<string, { seconds: number; project: string; color: string }>();
  for (const e of entries) {
    const name = e.task?.name ?? "Neznámý";
    const project = e.task?.project?.name ?? "";
    const color = e.task?.project?.color ?? "#94a3b8";
    const existing = map.get(name);
    map.set(name, {
      seconds: (existing?.seconds ?? 0) + (e.duration_seconds ?? 0),
      project,
      color,
    });
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 15);
}
