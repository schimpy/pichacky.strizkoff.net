import { createClient } from "@/lib/supabase/server";
import { createTimeEntry, updateTimeEntry, deleteTimeEntry } from "./actions";
import { formatDuration } from "@/lib/stats";
import EntryDialog from "@/components/EntryDialog";

type EntryRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  note: string | null;
  task: {
    id: string;
    name: string;
    project_id: string | null;
    project: { name: string; color: string } | null;
  } | null;
};

function timePart(iso: string) {
  return iso.slice(11, 16);
}
function datePart(iso: string) {
  return iso.slice(0, 10);
}
function dateLabel(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${Number(d)}. ${Number(m)}. ${y}`;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; task?: string }>;
}) {
  const { project, task } = await searchParams;
  const supabase = await createClient();

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("id, name, project_id, project:projects(id, name)")
    .eq("archived", false)
    .order("name");

  const tasks = (tasksData ?? []) as unknown as {
    id: string;
    name: string;
    project_id: string | null;
    project: { id: string; name: string } | null;
  }[];

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("name");

  let query = supabase
    .from("time_entries")
    .select(
      "id, started_at, ended_at, duration_seconds, note, task:tasks(id, name, project_id, project:projects(name, color))",
    )
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(200);

  if (task) query = query.eq("task_id", task);

  const { data: entries } = await query;

  const filtered = ((entries ?? []) as unknown as EntryRow[]).filter(
    (e) => !project || e.task?.project_id === project,
  );

  const totalSeconds = filtered.reduce((s, e) => s + (e.duration_seconds ?? 0), 0);
  const exportQs = new URLSearchParams();
  if (project) exportQs.set("project", project);
  if (task) exportQs.set("task", task);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem" }}>Historie</h1>
          <p className="muted" style={{ marginTop: "0.2rem" }}>
            Celkem {formatDuration(totalSeconds)} · {filtered.length} záznamů
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <a href={`/history/export?format=csv&${exportQs}`} className="btn btn-ghost">
            Export CSV
          </a>
          <a href={`/history/export?format=json&${exportQs}`} className="btn btn-ghost">
            Export JSON
          </a>
          {tasks.length > 0 && (
            <EntryDialog
              mode="new"
              tasks={tasks}
              saveAction={createTimeEntry}
              triggerClassName="btn btn-primary"
              triggerLabel="+ Nový záznam"
            />
          )}
        </div>
      </div>

      {/* Filtr */}
      <form className="card card-pad" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ minWidth: "12rem" }}>
          <label className="label">Projekt</label>
          <select name="project" defaultValue={project ?? ""} className="select">
            <option value="">Všechny projekty</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: "12rem" }}>
          <label className="label">Task</label>
          <select name="task" defaultValue={task ?? ""} className="select">
            <option value="">Všechny tasky</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-ghost">
          Filtrovat
        </button>
        {(project || task) && (
          <a href="/history" className="btn btn-ghost" style={{ color: "var(--muted)" }}>
            Zrušit filtr
          </a>
        )}
      </form>

      {/* Tabulka */}
      <div className="card">
        {filtered.length === 0 ? (
          <div className="card-pad muted">Žádné záznamy.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Task</th>
                <th>Od–Do</th>
                <th style={{ textAlign: "right" }}>Doba</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {dateLabel(e.started_at)}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="dot" style={{ background: e.task?.project?.color ?? "#cbd5e1" }} />
                      <div>
                        <div style={{ fontWeight: 500 }}>{e.task?.name}</div>
                        {(e.task?.project || e.note) && (
                          <div className="muted" style={{ fontSize: "0.8rem" }}>
                            {e.task?.project?.name}
                            {e.task?.project && e.note ? " · " : ""}
                            {e.note}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {timePart(e.started_at)}–{timePart(e.ended_at as string)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {formatDuration(e.duration_seconds ?? 0)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <EntryDialog
                      mode="edit"
                      tasks={tasks}
                      defaults={{
                        task_id: e.task?.id ?? "",
                        date: datePart(e.started_at),
                        start_time: timePart(e.started_at),
                        end_time: timePart(e.ended_at as string),
                        note: e.note ?? "",
                      }}
                      saveAction={updateTimeEntry.bind(null, e.id)}
                      deleteAction={deleteTimeEntry.bind(null, e.id)}
                      triggerClassName="btn btn-ghost btn-sm"
                      triggerLabel="Upravit"
                    />
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
