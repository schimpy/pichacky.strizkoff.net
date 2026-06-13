import { createClient } from "@/lib/supabase/server";
import TimerWidget from "@/components/TimerWidget";
import { formatDuration } from "@/lib/stats";
import { startOfDay, startOfWeek } from "date-fns";

export default async function DashboardPage() {
  const supabase = await createClient();

  type ProjectRef = { name: string; color: string } | null;

  const { data: runningData } = await supabase
    .from("time_entries")
    .select("id, started_at, task:tasks(id, name, project:projects(name, color))")
    .is("ended_at", null)
    .maybeSingle();

  const running = runningData as unknown as {
    id: string;
    started_at: string;
    task: { id: string; name: string; project: ProjectRef } | null;
  } | null;

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("id, name, project:projects(name, color)")
    .eq("archived", false)
    .order("name");

  const tasks = (tasksData ?? []) as unknown as {
    id: string;
    name: string;
    project: ProjectRef;
  }[];

  const todayStart = startOfDay(new Date()).toISOString();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

  const { data: todayEntries } = await supabase
    .from("time_entries")
    .select("duration_seconds")
    .gte("started_at", todayStart)
    .not("duration_seconds", "is", null);

  const { data: weekEntries } = await supabase
    .from("time_entries")
    .select("duration_seconds")
    .gte("started_at", weekStart)
    .not("duration_seconds", "is", null);

  const { data: recentData } = await supabase
    .from("time_entries")
    .select(
      "id, started_at, ended_at, duration_seconds, note, task:tasks(name, project:projects(name, color))",
    )
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(10);

  const recent = (recentData ?? []) as unknown as {
    id: string;
    started_at: string;
    ended_at: string | null;
    duration_seconds: number | null;
    note: string | null;
    task: { name: string; project: ProjectRef } | null;
  }[];

  const todayTotal = (todayEntries ?? []).reduce(
    (sum, e) => sum + (e.duration_seconds ?? 0),
    0,
  );
  const weekTotal = (weekEntries ?? []).reduce(
    (sum, e) => sum + (e.duration_seconds ?? 0),
    0,
  );

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <TimerWidget tasks={tasks ?? []} running={running} />

      <div className="flex gap-4">
        <div className="rounded border p-4">
          <div className="text-sm text-gray-500">Dnes</div>
          <div className="text-xl font-semibold">{formatDuration(todayTotal)}</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-sm text-gray-500">Tento týden</div>
          <div className="text-xl font-semibold">{formatDuration(weekTotal)}</div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Poslední záznamy</h2>
        {(recent ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">Zatím žádné záznamy.</p>
        ) : (
          <ul className="divide-y">
            {(recent ?? []).map((e) => (
              <li key={e.id} className="py-2 flex justify-between text-sm">
                <span>
                  {e.task?.project ? `${e.task.project.name} / ` : ""}
                  {e.task?.name}
                  {e.note ? ` — ${e.note}` : ""}
                </span>
                <span>{formatDuration(e.duration_seconds ?? 0)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
