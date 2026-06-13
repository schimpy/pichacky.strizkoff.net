import { createClient } from "@/lib/supabase/server";
import { createTimeEntry, updateTimeEntry, deleteTimeEntry } from "./actions";
import { formatDuration } from "@/lib/stats";

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
    project: { name: string } | null;
  } | null;
};

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
      "id, started_at, ended_at, duration_seconds, note, task:tasks(id, name, project_id, project:projects(name))",
    )
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(100);

  if (task) query = query.eq("task_id", task);

  const { data: entries } = await query;

  const filtered = ((entries ?? []) as unknown as EntryRow[]).filter(
    (e) => !project || e.task?.project_id === project,
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Historie</h1>
        <div className="flex gap-2">
          <a
            href="/history/export?format=csv"
            className="rounded bg-gray-200 px-3 py-1 text-sm"
          >
            Export CSV
          </a>
          <a
            href="/history/export?format=json"
            className="rounded bg-gray-200 px-3 py-1 text-sm"
          >
            Export JSON
          </a>
        </div>
      </div>

      <form className="flex gap-2 flex-wrap">
        <select name="project" defaultValue={project ?? ""} className="border rounded px-2 py-1">
          <option value="">Všechny projekty</option>
          {(projects ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select name="task" defaultValue={task ?? ""} className="border rounded px-2 py-1">
          <option value="">Všechny tasky</option>
          {(tasks ?? []).map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <button className="rounded bg-gray-200 px-3 py-1">Filtrovat</button>
      </form>

      <details className="border rounded p-3">
        <summary className="cursor-pointer font-semibold">Nový záznam</summary>
        <form action={createTimeEntry} className="grid grid-cols-2 gap-2 mt-3 max-w-md">
          <select name="task_id" required className="border rounded px-2 py-1 col-span-2">
            {(tasks ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.project ? `${t.project.name} / ` : ""}
                {t.name}
              </option>
            ))}
          </select>
          <input type="date" name="date" required className="border rounded px-2 py-1 col-span-2" />
          <input type="time" name="start_time" required className="border rounded px-2 py-1" />
          <input type="time" name="end_time" required className="border rounded px-2 py-1" />
          <input name="note" placeholder="Poznámka" className="border rounded px-2 py-1 col-span-2" />
          <button className="rounded bg-blue-600 text-white px-3 py-1 col-span-2">Uložit</button>
        </form>
      </details>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-1 pr-2">Datum</th>
            <th className="pr-2">Task</th>
            <th className="pr-2">Od - Do</th>
            <th className="pr-2">Doba</th>
            <th className="pr-2">Poznámka</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((e) => {
            const start = new Date(e.started_at);
            const end = new Date(e.ended_at as string);
            return (
              <tr key={e.id} className="border-b align-top">
                <td className="py-1 pr-2 whitespace-nowrap">
                  {start.toLocaleDateString("cs-CZ")}
                </td>
                <td className="pr-2">
                  {e.task?.project ? `${e.task.project.name} / ` : ""}
                  {e.task?.name}
                </td>
                <td className="pr-2 whitespace-nowrap">
                  {start.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
                  {" - "}
                  {end.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="pr-2 whitespace-nowrap">{formatDuration(e.duration_seconds ?? 0)}</td>
                <td className="pr-2">{e.note}</td>
                <td>
                  <details>
                    <summary className="cursor-pointer text-blue-600">Upravit</summary>
                    <form
                      action={updateTimeEntry.bind(null, e.id)}
                      className="grid grid-cols-2 gap-2 mt-2 min-w-48"
                    >
                      <input
                        type="date"
                        name="date"
                        defaultValue={start.toISOString().slice(0, 10)}
                        className="border rounded px-2 py-1 col-span-2"
                      />
                      <input
                        type="time"
                        name="start_time"
                        defaultValue={start.toTimeString().slice(0, 5)}
                        className="border rounded px-2 py-1"
                      />
                      <input
                        type="time"
                        name="end_time"
                        defaultValue={end.toTimeString().slice(0, 5)}
                        className="border rounded px-2 py-1"
                      />
                      <input
                        name="note"
                        defaultValue={e.note ?? ""}
                        className="border rounded px-2 py-1 col-span-2"
                      />
                      <button className="rounded bg-blue-600 text-white px-3 py-1 col-span-2">
                        Uložit
                      </button>
                    </form>
                    <form action={deleteTimeEntry.bind(null, e.id)} className="mt-1">
                      <button className="text-red-600">Smazat</button>
                    </form>
                  </details>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="py-4 text-gray-500">
                Žádné záznamy.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
