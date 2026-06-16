import { createClient } from "@/lib/supabase/server";
import TimerWidget from "@/components/TimerWidget";
import { formatDuration } from "@/lib/stats";
import { startOfDay, startOfWeek } from "date-fns";

type ProjectRef = { name: string; color: string } | null;

export default async function DashboardPage() {
  const supabase = await createClient();

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
    .limit(8);

  const recent = (recentData ?? []) as unknown as {
    id: string;
    started_at: string;
    ended_at: string | null;
    duration_seconds: number | null;
    note: string | null;
    task: { name: string; project: ProjectRef } | null;
  }[];

  const todayTotal = (todayEntries ?? []).reduce((s, e) => s + (e.duration_seconds ?? 0), 0);
  const weekTotal = (weekEntries ?? []).reduce((s, e) => s + (e.duration_seconds ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem" }}>Přehled</h1>
        <p className="muted" style={{ marginTop: "0.2rem" }}>
          Spusť časovač nebo si zkontroluj dnešní výkon.
        </p>
      </div>

      <TimerWidget tasks={tasks} running={running} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
        }}
      >
        <StatCard label="Dnes" value={formatDuration(todayTotal)} />
        <StatCard label="Tento týden" value={formatDuration(weekTotal)} />
        <StatCard label="Aktivních tasků" value={String(tasks.length)} />
      </div>

      <div className="card">
        <div
          className="card-pad"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h2 style={{ fontSize: "1rem" }}>Poslední záznamy</h2>
          <a href="/history" className="btn btn-ghost btn-sm">
            Vše →
          </a>
        </div>
        {recent.length === 0 ? (
          <div className="card-pad muted">Zatím žádné záznamy.</div>
        ) : (
          <table className="table">
            <tbody>
              {recent.map((e) => (
                <tr key={e.id}>
                  <td style={{ width: "0.5rem", paddingRight: 0 }}>
                    <span
                      className="dot"
                      style={{ background: e.task?.project?.color ?? "#cbd5e1" }}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{e.task?.name}</div>
                    {(e.task?.project || e.note) && (
                      <div className="muted" style={{ fontSize: "0.8rem" }}>
                        {e.task?.project?.name}
                        {e.task?.project && e.note ? " · " : ""}
                        {e.note}
                      </div>
                    )}
                  </td>
                  <td className="muted" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {new Date(e.started_at).toLocaleDateString("cs-CZ", {
                      day: "numeric",
                      month: "numeric",
                    })}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDuration(e.duration_seconds ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card card-pad">
      <div className="muted" style={{ fontSize: "0.8rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, marginTop: "0.2rem" }}>{value}</div>
    </div>
  );
}
