import { createClient } from "@/lib/supabase/server";
import { createTimeEntry, deleteTimeEntry } from "./actions";
import { formatDuration } from "@/lib/stats";
import { fmtDate, fmtTime, dateInputValue, timeInputValue, wallToUtcIso } from "@/lib/time";
import SubmitButton from "@/components/SubmitButton";
import TaskCombobox from "@/components/TaskCombobox";
import InlineEditButton from "./InlineEditButton";

type TaskRef = {
  id: string;
  name: string;
  project_id: string | null;
  project: { name: string } | null;
};

type EntryRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  note: string | null;
  task: TaskRef | null;
};

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string; sort?: string; project?: string }>;
}) {
  const { q = "", from, to, sort = "desc", project } = await searchParams;
  const supabase = await createClient();

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("id, name, project_id, project:projects(id, name, color)")
    .order("name");

  const tasks = (tasksData ?? []) as unknown as {
    id: string;
    name: string;
    project_id: string | null;
    project: { id: string; name: string; color: string } | null;
  }[];

  const { data: projects } = await supabase.from("projects").select("id, name").order("name");

  let query = supabase
    .from("time_entries")
    .select("id, started_at, ended_at, duration_seconds, note, task:tasks(id, name, project_id, project:projects(name))")
    .not("ended_at", "is", null)
    .order("started_at", { ascending: sort === "asc" })
    .limit(200);

  if (from) query = query.gte("started_at", wallToUtcIso(from, "00:00"));
  if (to) query = query.lte("started_at", wallToUtcIso(to, "23:59:59"));

  const { data: entriesData } = await query;
  let entries = (entriesData ?? []) as unknown as EntryRow[];

  if (q) {
    const lower = q.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.task?.name?.toLowerCase().includes(lower) ||
        e.task?.project?.name?.toLowerCase().includes(lower) ||
        e.note?.toLowerCase().includes(lower),
    );
  }
  if (project) {
    entries = entries.filter((e) => e.task?.project_id === project);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem" }}>Historie</h1>
          <p className="muted" style={{ marginTop: "0.2rem" }}>{entries.length} záznamů</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <a href="/history/export?format=csv" className="btn btn-ghost btn-sm">↓ CSV</a>
          <a href="/history/export?format=json" className="btn btn-ghost btn-sm">↓ JSON</a>
        </div>
      </div>

      {/* Filters */}
      <form
        className="card card-pad"
        style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "flex-end" }}
      >
        <div style={{ flex: 2, minWidth: "12rem" }}>
          <label className="label">Hledat</label>
          <input name="q" defaultValue={q} placeholder="Task, projekt, poznámka…" className="input" />
        </div>
        <div>
          <label className="label">Projekt</label>
          <select name="project" defaultValue={project ?? ""} className="select">
            <option value="">Vše</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Od</label>
          <input name="from" type="date" defaultValue={from ?? ""} className="input" style={{ width: "9rem" }} />
        </div>
        <div>
          <label className="label">Do</label>
          <input name="to" type="date" defaultValue={to ?? ""} className="input" style={{ width: "9rem" }} />
        </div>
        <div>
          <label className="label">Řadit</label>
          <select name="sort" defaultValue={sort} className="select" style={{ width: "8rem" }}>
            <option value="desc">Nejnovější</option>
            <option value="asc">Nejstarší</option>
          </select>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="submit" className="btn btn-primary">Filtrovat</button>
          <a href="/history" className="btn btn-ghost">Reset</a>
        </div>
      </form>

      {/* Add entry */}
      <div className="card">
        <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1rem" }}>Přidat záznam</h2>
        </div>
        <form action={createTimeEntry} className="card-pad" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: "12rem" }}>
            <label className="label">Task</label>
            <TaskCombobox tasks={tasks} />
          </div>
          <div>
            <label className="label">Datum</label>
            <input type="date" name="date" required className="input" style={{ width: "9rem" }} defaultValue={dateInputValue(new Date())} />
          </div>
          <div>
            <label className="label">Od</label>
            <input type="time" name="start_time" required className="input" style={{ width: "7rem" }} />
          </div>
          <div>
            <label className="label">Do</label>
            <input type="time" name="end_time" required className="input" style={{ width: "7rem" }} />
          </div>
          <div style={{ flex: 1, minWidth: "8rem" }}>
            <label className="label">Poznámka</label>
            <input name="note" placeholder="Volitelně…" className="input" />
          </div>
          <SubmitButton className="btn btn-primary" pendingText="Ukládám…">Přidat</SubmitButton>
        </form>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Datum</th>
              <th>Od – Do</th>
              <th>Doba</th>
              <th>Poznámka</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>
                  Žádné záznamy.
                </td>
              </tr>
            )}
            {entries.map((e) => (
              <tr key={e.id}>
                <td>
                  <span style={{ fontWeight: 500 }}>{e.task?.name}</span>
                  {e.task?.project && (
                    <div className="muted" style={{ fontSize: "0.8rem" }}>{e.task.project.name}</div>
                  )}
                </td>
                <td className="muted" style={{ whiteSpace: "nowrap" }}>
                  {fmtDate(e.started_at, "d. M. yy")}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {fmtTime(e.started_at)} – {fmtTime(e.ended_at as string)}
                </td>
                <td style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                  {formatDuration(e.duration_seconds ?? 0)}
                </td>
                <td className="muted" style={{ maxWidth: "12rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.note}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <InlineEditButton
                      entryId={e.id}
                      taskId={e.task?.id}
                      defaultDate={dateInputValue(e.started_at)}
                      defaultStart={timeInputValue(e.started_at)}
                      defaultEnd={timeInputValue(e.ended_at as string)}
                      defaultNote={e.note ?? ""}
                      tasks={tasks}
                    />
                    <form action={deleteTimeEntry.bind(null, e.id)} style={{ display: "inline" }}>
                      <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">Smazat</SubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
