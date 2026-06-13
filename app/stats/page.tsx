import { createClient } from "@/lib/supabase/server";
import { formatDuration, groupByDay, groupByProject } from "@/lib/stats";
import { subDays } from "date-fns";

export default async function StatsPage() {
  const supabase = await createClient();
  const since = subDays(new Date(), 30).toISOString();

  const { data: entries } = await supabase
    .from("time_entries")
    .select("started_at, duration_seconds, task:tasks(project:projects(name, color))")
    .not("ended_at", "is", null)
    .gte("started_at", since);

  const rows = entries ?? [];
  const byDay = groupByDay(rows);
  const byProject = groupByProject(rows as never);

  const maxDay = Math.max(1, ...byDay.map(([, s]) => s));
  const maxProject = Math.max(1, ...byProject.map((p) => p.seconds));

  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold">Statistiky (posledních 30 dní)</h1>

      <section>
        <h2 className="text-lg font-semibold mb-2">Podle dne</h2>
        {byDay.length === 0 ? (
          <p className="text-sm text-gray-500">Žádná data.</p>
        ) : (
          <div className="space-y-1">
            {byDay.map(([day, seconds]) => (
              <div key={day} className="flex items-center gap-2 text-sm">
                <span className="w-24 shrink-0">{day}</span>
                <div className="flex-1 bg-gray-100 rounded">
                  <div
                    className="bg-blue-500 rounded h-4"
                    style={{ width: `${(seconds / maxDay) * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right">{formatDuration(seconds)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Podle projektu</h2>
        {byProject.length === 0 ? (
          <p className="text-sm text-gray-500">Žádná data.</p>
        ) : (
          <div className="space-y-1">
            {byProject.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-sm">
                <span className="w-32 shrink-0">{p.name}</span>
                <div className="flex-1 bg-gray-100 rounded">
                  <div
                    className="rounded h-4"
                    style={{ width: `${(p.seconds / maxProject) * 100}%`, backgroundColor: p.color }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right">{formatDuration(p.seconds)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
