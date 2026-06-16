import { createClient } from "@/lib/supabase/server";
import {
  createProject,
  archiveProject,
  createTag,
  deleteTag,
  createTask,
  archiveTask,
} from "./actions";
import SubmitButton from "@/components/SubmitButton";

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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem" }}>Tasky</h1>
        <p className="muted" style={{ marginTop: "0.2rem" }}>
          Spravuj projekty, tagy a tasky, které pak měříš časovačem.
        </p>
      </div>

      {/* Nový task */}
      <div className="card card-pad">
        <h2 style={{ fontSize: "1rem", marginBottom: "0.9rem" }}>Nový task</h2>
        <form action={createTask} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }}>
            <div>
              <label className="label">Název tasku</label>
              <input name="name" required placeholder="Např. Implementace přihlášení" className="input" />
            </div>
            <div>
              <label className="label">Projekt</label>
              <select name="project_id" className="select">
                <option value="">— bez projektu —</option>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {(tags ?? []).length > 0 && (
            <div>
              <label className="label">Tagy</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {(tags ?? []).map((t) => (
                  <label
                    key={t.id}
                    className="badge"
                    style={{ cursor: "pointer", userSelect: "none", background: "#f1f5f9", color: "var(--text)" }}
                  >
                    <input type="checkbox" name="tag_ids" value={t.id} style={{ margin: 0 }} />
                    {t.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div>
            <SubmitButton pendingText="Přidávám…">+ Přidat task</SubmitButton>
          </div>
        </form>
      </div>

      {/* Seznam tasků */}
      <div className="card">
        <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1rem" }}>Aktivní tasky</h2>
        </div>
        {tasks.length === 0 ? (
          <div className="card-pad muted">Zatím žádné tasky.</div>
        ) : (
          <table className="table">
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td style={{ width: "0.5rem", paddingRight: 0 }}>
                    <span className="dot" style={{ background: t.project?.color ?? "#cbd5e1" }} />
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{t.name}</span>
                    {t.project && <span className="muted"> · {t.project.name}</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                      {t.task_tags
                        ?.map((tt) => tt.tag)
                        .filter(Boolean)
                        .map((tag) => (
                          <span key={tag!.id} className="badge">
                            {tag!.name}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <form action={archiveTask.bind(null, t.id)}>
                      <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">
                        Archivovat
                      </SubmitButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        {/* Projekty */}
        <div className="card">
          <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "1rem" }}>Projekty</h2>
          </div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {(projects ?? []).length === 0 && <p className="muted" style={{ margin: 0 }}>Žádné projekty.</p>}
            {(projects ?? []).map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="dot" style={{ background: p.color }} />
                <span style={{ flex: 1 }}>{p.name}</span>
                <form action={archiveProject.bind(null, p.id)}>
                  <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">
                    Archivovat
                  </SubmitButton>
                </form>
              </div>
            ))}
            <form action={createProject} style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <input name="name" placeholder="Nový projekt" required className="input" style={{ flex: 1 }} />
              <input name="color" type="color" defaultValue="#4f46e5" className="input" style={{ width: "3rem", padding: "0.2rem" }} />
              <SubmitButton pendingText="…">Přidat</SubmitButton>
            </form>
          </div>
        </div>

        {/* Tagy */}
        <div className="card">
          <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 style={{ fontSize: "1rem" }}>Tagy</h2>
          </div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {(tags ?? []).length === 0 && <p className="muted" style={{ margin: 0 }}>Žádné tagy.</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {(tags ?? []).map((t) => (
                <span key={t.id} className="badge" style={{ paddingRight: "0.3rem" }}>
                  {t.name}
                  <form action={deleteTag.bind(null, t.id)} style={{ display: "inline-flex" }}>
                    <button
                      type="submit"
                      title="Smazat tag"
                      style={{
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        color: "var(--muted)",
                        padding: "0 0.1rem",
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </form>
                </span>
              ))}
            </div>
            <form action={createTag} style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <input name="name" placeholder="Nový tag" required className="input" style={{ flex: 1 }} />
              <SubmitButton pendingText="…">Přidat</SubmitButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
