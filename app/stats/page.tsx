import { createClient } from "@/lib/supabase/server";
import { formatDuration, groupByDay, groupByProject } from "@/lib/stats";
import { subDays } from "date-fns";

type StatEntry = {
  started_at: string;
  duration_seconds: number | null;
  task: { project: { name: string; color: string } | null } | null;
};

export default async function StatsPage() {
  const supabase = await createClient();
  const since = subDays(new Date(), 30).toISOString();

  const { data } = await supabase
    .from("time_entries")
    .select("started_at, duration_seconds, task:tasks(project:projects(name, color))")
    .not("ended_at", "is", null)
    .gte("started_at", since);

  const rows = (data ?? []) as unknown as StatEntry[];
  const byDay = groupByDay(rows);
  const byProject = groupByProject(rows);
  const total = rows.reduce((s, e) => s + (e.duration_seconds ?? 0), 0);

  const maxDay = Math.max(1, ...byDay.map(([, s]) => s));
  const maxProject = Math.max(1, ...byProject.map((p) => p.seconds));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem" }}>Statistiky</h1>
        <p className="muted" style={{ marginTop: "0.2rem" }}>
          Posledních 30 dní · celkem {formatDuration(total)}
        </p>
      </div>

      <div className="card">
        <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1rem" }}>Podle projektu</h2>
        </div>
        <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {byProject.length === 0 && <p className="muted" style={{ margin: 0 }}>Žádná data.</p>}
          {byProject.map((p) => (
            <div key={p.name}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.85rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span className="dot" style={{ background: p.color }} />
                  {p.name}
                </span>
                <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {formatDuration(p.seconds)}
                </span>
              </div>
              <div style={{ height: "0.5rem", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${(p.seconds / maxProject) * 100}%`,
                    height: "100%",
                    background: p.color,
                    borderRadius: "9999px",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1rem" }}>Podle dne</h2>
        </div>
        <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {byDay.length === 0 && <p className="muted" style={{ margin: 0 }}>Žádná data.</p>}
          {byDay.map(([day, seconds]) => {
            const [, m, d] = day.split("-");
            return (
              <div key={day} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.85rem" }}>
                <span className="muted" style={{ width: "4rem", flexShrink: 0 }}>
                  {Number(d)}. {Number(m)}.
                </span>
                <div style={{ flex: 1, height: "0.75rem", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(seconds / maxDay) * 100}%`,
                      height: "100%",
                      background: "var(--brand)",
                      borderRadius: "9999px",
                    }}
                  />
                </div>
                <span style={{ width: "4.5rem", textAlign: "right", flexShrink: 0, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {formatDuration(seconds)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
