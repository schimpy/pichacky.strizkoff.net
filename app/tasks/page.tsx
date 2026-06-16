import { createClient } from "@/lib/supabase/server";
import { archiveProject, archiveTask, createProject, createTag, createTask, deleteTag } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import EditProjectModal from "@/components/EditProjectModal";
import EditTaskModal from "@/components/EditTaskModal";

export default async function TasksPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, color")
    .eq("archived", false)
    .order("name");

  const { data: tags } = await supabase.from("tags").select("id, name").order("name");

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("id, name, project_id, recurring, project:projects(name, color), task_tags(tag_id, tag:tags(id, name))")
    .eq("archived", false)
    .order("name");

  const tasks = (tasksData ?? []) as unknown as {
    id: string;
    name: string;
    project_id: string | null;
    recurring: boolean;
    project: { name: string; color: string } | null;
    task_tags: { tag_id: string; tag: { id: string; name: string } | null }[];
  }[];

  const recurring = tasks.filter((t) => t.recurring);
  const oneOff = tasks.filter((t) => !t.recurring);

  const projectList = projects ?? [];
  const tagList = tags ?? [];

  const sectionHead = (title: string) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginBottom: "0.75rem",
        paddingBottom: "0.5rem",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <h2 style={{ fontSize: "1rem", flex: 1 }}>{title}</h2>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "1.5rem" }}>Tasky</h1>
        <p className="muted" style={{ marginTop: "0.2rem" }}>
          Správa projektů, tagů a tasků.
        </p>
      </div>

      {/* ---- Projects ---- */}
      <div className="card card-pad">
        {sectionHead("Projekty")}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
          {projectList.length === 0 && <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}>Žádné projekty.</p>}
          {projectList.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="dot" style={{ background: p.color }} />
              <span style={{ flex: 1, fontSize: "0.875rem", fontWeight: 500 }}>{p.name}</span>
              <EditProjectModal project={p} />
              <form action={archiveProject.bind(null, p.id)}>
                <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">Archivovat</SubmitButton>
              </form>
            </div>
          ))}
        </div>
        <form action={createProject} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label className="label">Nový projekt</label>
            <input name="name" placeholder="Název" required className="input" />
          </div>
          <input name="color" type="color" defaultValue="#4f46e5" className="input" style={{ width: "3rem", height: "2.35rem", padding: "0.2rem" }} />
          <SubmitButton className="btn btn-primary" pendingText="…">Přidat</SubmitButton>
        </form>
      </div>

      {/* ---- Tags ---- */}
      <div className="card card-pad">
        {sectionHead("Tagy")}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
          {tagList.length === 0 && <span className="muted" style={{ fontSize: "0.875rem" }}>Žádné tagy.</span>}
          {tagList.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span className="badge">{t.name}</span>
              <form action={deleteTag.bind(null, t.id)} style={{ display: "inline" }}>
                <button type="submit" className="muted" style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", padding: "0 0.2rem" }}>✕</button>
              </form>
            </div>
          ))}
        </div>
        <form action={createTag} style={{ display: "flex", gap: "0.5rem" }}>
          <div style={{ flex: 1 }}>
            <label className="label">Nový tag</label>
            <input name="name" placeholder="Název tagu" required className="input" />
          </div>
          <SubmitButton className="btn btn-primary" pendingText="…" >Přidat</SubmitButton>
        </form>
      </div>

      {/* ---- Tasks ---- */}
      <div className="card">
        <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "1rem" }}>Tasky</h2>
        </div>

        {recurring.length > 0 && (
          <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              🔁 Opakující se
            </p>
            <TaskList
              tasks={recurring}
              projects={projectList}
              tags={tagList}
            />
          </div>
        )}

        {oneOff.length > 0 && (
          <div className="card-pad" style={{ borderBottom: "1px solid var(--border)" }}>
            {recurring.length > 0 && (
              <p className="muted" style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                Jednorázové
              </p>
            )}
            <TaskList
              tasks={oneOff}
              projects={projectList}
              tags={tagList}
            />
          </div>
        )}

        {tasks.length === 0 && (
          <div className="card-pad muted">Žádné tasky.</div>
        )}

        <div className="card-pad">
          <p className="label" style={{ marginBottom: "0.75rem" }}>Nový task</p>
          <form action={createTask} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <input name="name" placeholder="Název tasku" required className="input" />
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <select name="project_id" className="select" style={{ flex: 1, minWidth: "10rem" }}>
                <option value="">Bez projektu</option>
                {projectList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {tagList.length > 0 && (
                <select name="tag_ids" multiple className="select" style={{ flex: 1, minWidth: "10rem", height: "5rem" }}>
                  {tagList.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
              <input name="recurring" type="checkbox" style={{ width: "1rem", height: "1rem" }} />
              Opakující se task
            </label>
            <div>
              <SubmitButton className="btn btn-primary" pendingText="Ukládám…">Přidat task</SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function TaskList({
  tasks,
  projects,
  tags,
}: {
  tasks: {
    id: string;
    name: string;
    project_id: string | null;
    recurring: boolean;
    project: { name: string; color: string } | null;
    task_tags: { tag_id: string; tag: { id: string; name: string } | null }[];
  }[];
  projects: { id: string; name: string; color: string }[];
  tags: { id: string; name: string }[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      {tasks.map((t) => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {t.project && <span className="dot" style={{ background: t.project.color, flexShrink: 0 }} />}
          <span style={{ flex: 1, fontSize: "0.875rem" }}>
            {t.project && <span className="muted">{t.project.name} · </span>}
            <span style={{ fontWeight: 500 }}>{t.name}</span>
            {t.task_tags
              .filter((tt) => tt.tag)
              .map((tt) => (
                <span key={tt.tag_id} className="badge" style={{ marginLeft: "0.4rem" }}>
                  {tt.tag!.name}
                </span>
              ))}
          </span>
          <EditTaskModal
            task={{ id: t.id, name: t.name, project_id: t.project_id, recurring: t.recurring }}
            projects={projects}
            tags={tags}
            currentTagIds={t.task_tags.map((tt) => tt.tag_id)}
          />
          <form action={archiveTask.bind(null, t.id)}>
            <SubmitButton className="btn btn-ghost btn-sm" pendingText="…">Archivovat</SubmitButton>
          </form>
        </div>
      ))}
    </div>
  );
}
