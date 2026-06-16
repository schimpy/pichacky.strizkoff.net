import { createClient } from "@/lib/supabase/server";
import { formatDuration, groupByDay, groupByProject, groupByTask } from "@/lib/stats";
import { subDays } from "date-fns";
import PeriodPicker from "@/components/PeriodPicker";
import { Suspense } from "react";

type StatEntry = {
  started_at: string;
  duration_seconds: number | null;
  task: { name: string; project: { name: string; color: string } | null } | null;
};

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period = "30" } = await searchParams;
  const supabase = await createClient();

  const since = period === "all" ? null : subDays(new Date(), parseInt(period)).toISOString();

  let query = supabase
    .from("time_entries")
    .select("started_at, duration_seconds, task:tasks(name, project:projects(name, color))")
    .not("ended_at", "is", null);

  if (since) query = query.gte("started_at", since);

  const { data } = await query;
  const rows = (data ?? []) as unknown as StatEntry[];

  const byDay = groupByDay(rows);
  const byProject = groupByProject(rows);
  const byTask = groupByTask(rows);
  const total = rows.reduce((s, e) => s + (e.duration_seconds ?? 0), 0);

  const maxDay = Math.max(1, ...byDay.map(([, s]) => s));
  const maxProject = Math.max(1, ...byProject.map((p) => p.seconds));
  const maxTask = Math.max(1, ...byTask.map((t) => t.seconds));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem" }}>Statistiky</h1>
          <p className="muted" style={{ marginTop: "0.2rem" }}>
            Celkem za období: <strong>{formatDuration(total)}</strong> · {rows.length} záznamů
          </p>
        </div>
        <Suspense>
          <PeriodPicker />
        </Suspense>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        {/* By project */}
        <div className="card">
          <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "1rem" }}>Podle projektu</h2>
          </div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {byProject.length === 0 && <p className="muted" style={{ margin: 0 }}>Žádná data.</p>}
            {byProject.map((p) => (
              <BarRow
                key={p.name}
                label={p.name}
                seconds={p.seconds}
                max={maxProject}
                color={p.color}
                total={total}
              />
            ))}
          </div>
        </div>

        {/* By task */}
        <div className="card">
          <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "1rem" }}>Podle tasku (top 15)</h2>
          </div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {byTask.length === 0 && <p className="muted" style={{ margin: 0 }}>Žádná data.</p>}
            {byTask.map((t) => (
              <BarRow
                key={t.name}
                label={t.name}
                sublabel={t.project}
                seconds={t.seconds}
                max={maxTask}
                color={t.color}
                total={total}
              />
            ))}
          </div>
        </div>
      </div>

      {/* By day */}
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
                <span className="muted" style={{ width: "3.5rem", flexShrink: 0 }}>
                  {Number(d)}. {Number(m)}.
                </span>
                <div style={{ flex: 1, height: "0.6rem", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(seconds / maxDay) * 100}%`,
                      height: "100%",
                      background: "var(--brand)",
                      borderRadius: "9999px",
                    }}
                  />
                </div>
                <span style={{ width: "4rem", textAlign: "right", flexShrink: 0, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
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

function BarRow({
  label,
  sublabel,
  seconds,
  max,
  color,
  total,
}: {
  label: string;
  sublabel?: string;
  seconds: number;
  max: number;
  color: string;
  total: number;
}) {
  const pct = total > 0 ? Math.round((seconds / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.85rem" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
          <span className="dot" style={{ background: color, flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sublabel && <span className="muted" style={{ marginRight: "0.25rem" }}>{sublabel} ·</span>}
            {label}
          </span>
        </span>
        <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", flexShrink: 0, marginLeft: "0.5rem" }}>
          {formatDuration(seconds)}
          <span className="muted" style={{ fontWeight: 400, marginLeft: "0.3rem" }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ height: "0.4rem", background: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
        <div
          style={{
            width: `${(seconds / max) * 100}%`,
            height: "100%",
            background: color,
            borderRadius: "9999px",
          }}
        />
      </div>
    </div>
  );
}
