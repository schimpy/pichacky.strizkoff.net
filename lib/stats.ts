export function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function groupByDay(
  entries: { started_at: string; duration_seconds: number | null }[],
) {
  const map = new Map<string, number>();
  for (const e of entries) {
    const day = e.started_at.slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + (e.duration_seconds ?? 0));
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

type EntryWithProject = {
  duration_seconds: number | null;
  task: { project: { name: string; color: string } | null } | null;
};

export function groupByProject(entries: EntryWithProject[]) {
  const map = new Map<string, { seconds: number; color: string }>();
  for (const e of entries) {
    const name = e.task?.project?.name ?? "Bez projektu";
    const color = e.task?.project?.color ?? "#888888";
    const existing = map.get(name);
    map.set(name, {
      seconds: (existing?.seconds ?? 0) + (e.duration_seconds ?? 0),
      color,
    });
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.seconds - a.seconds);
}
