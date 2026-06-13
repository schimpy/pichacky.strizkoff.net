import { createClient } from "@/lib/supabase/server";
import {
  createProject,
  archiveProject,
  createTag,
  deleteTag,
  createTask,
  archiveTask,
} from "./actions";

export default async function TasksPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("archived", false)
    .order("name");

  const { data: tags } = await supabase.from("tags").select("*").order("name");

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("id, name, project:projects(name, color), task_tags(tag:tags(id, name))")
    .eq("archived", false)
    .order("name");

  const tasks = (tasksData ?? []) as unknown as {
    id: string;
    name: string;
    project: { name: string; color: string } | null;
    task_tags: { tag: { id: string; name: string } | null }[];
  }[];

  return (
    <div className="p-6 space-y-10 max-w-2xl">
      <h1 className="text-2xl font-bold">Tasky</h1>

      <section>
        <h2 className="text-lg font-semibold mb-2">Projekty</h2>
        <ul className="space-y-1 mb-3">
          {(projects ?? []).map((p) => (
            <li key={p.id} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="flex-1">{p.name}</span>
              <form action={archiveProject.bind(null, p.id)}>
                <button className="text-gray-500">Archivovat</button>
              </form>
            </li>
          ))}
          {(projects ?? []).length === 0 && (
            <li className="text-sm text-gray-500">Žádné projekty.</li>
          )}
        </ul>
        <form action={createProject} className="flex gap-2">
          <input
            name="name"
            placeholder="Název projektu"
            required
            className="border rounded px-2 py-1 flex-1"
          />
          <input
            name="color"
            type="color"
            defaultValue="#3b82f6"
            className="border rounded h-9 w-12"
          />
          <button className="rounded bg-blue-600 text-white px-3 py-1">Přidat</button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Tagy</h2>
        <ul className="space-y-1 mb-3">
          {(tags ?? []).map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1">{t.name}</span>
              <form action={deleteTag.bind(null, t.id)}>
                <button className="text-gray-500">Smazat</button>
              </form>
            </li>
          ))}
          {(tags ?? []).length === 0 && (
            <li className="text-sm text-gray-500">Žádné tagy.</li>
          )}
        </ul>
        <form action={createTag} className="flex gap-2">
          <input
            name="name"
            placeholder="Název tagu"
            required
            className="border rounded px-2 py-1 flex-1"
          />
          <button className="rounded bg-blue-600 text-white px-3 py-1">Přidat</button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Tasky</h2>
        <ul className="space-y-1 mb-3">
          {(tasks ?? []).map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1">
                {t.project ? `${t.project.name} / ` : ""}
                {t.name}
                {t.task_tags && t.task_tags.length > 0
                  ? ` [${t.task_tags
                      .map((tt: { tag: { name: string } | null }) => tt.tag?.name)
                      .filter(Boolean)
                      .join(", ")}]`
                  : ""}
              </span>
              <form action={archiveTask.bind(null, t.id)}>
                <button className="text-gray-500">Archivovat</button>
              </form>
            </li>
          ))}
          {(tasks ?? []).length === 0 && (
            <li className="text-sm text-gray-500">Žádné tasky.</li>
          )}
        </ul>
        <form action={createTask} className="flex gap-2 flex-wrap items-start">
          <input
            name="name"
            placeholder="Název tasku"
            required
            className="border rounded px-2 py-1"
          />
          <select name="project_id" className="border rounded px-2 py-1">
            <option value="">Bez projektu</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select name="tag_ids" multiple className="border rounded px-2 py-1">
            {(tags ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button className="rounded bg-blue-600 text-white px-3 py-1">Přidat</button>
        </form>
      </section>
    </div>
  );
}
