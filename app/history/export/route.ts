import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import { fmtDate, fmtTime } from "@/lib/time";

type ExportEntry = {
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  note: string | null;
  task: { project_id: string | null; name: string; project: { name: string } | null } | null;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const sp = request.nextUrl.searchParams;
  const format = sp.get("format") === "json" ? "json" : "csv";
  const project = sp.get("project");
  const taskFilter = sp.get("task");

  let query = supabase
    .from("time_entries")
    .select(
      "started_at, ended_at, duration_seconds, note, task:tasks(project_id, name, project:projects(name))",
    )
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false });

  if (taskFilter) query = query.eq("task_id", taskFilter);

  const { data: entries } = await query;

  const rows = ((entries ?? []) as unknown as ExportEntry[])
    .filter((e) => !project || e.task?.project_id === project)
    .map((e) => ({
    date: fmtDate(e.started_at, "yyyy-MM-dd"),
    project: e.task?.project?.name ?? "",
    task: e.task?.name ?? "",
    started_at: `${fmtDate(e.started_at, "yyyy-MM-dd")} ${fmtTime(e.started_at)}`,
    ended_at: e.ended_at ? `${fmtDate(e.ended_at, "yyyy-MM-dd")} ${fmtTime(e.ended_at)}` : "",
    duration_seconds: e.duration_seconds,
    note: e.note ?? "",
  }));

  if (format === "json") {
    return new Response(JSON.stringify(rows, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="pichacky-export.json"',
      },
    });
  }

  const header = "date,project,task,started_at,ended_at,duration_seconds,note";
  const csvEscape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    header,
    ...rows.map((r) =>
      [r.date, r.project, r.task, r.started_at, r.ended_at, r.duration_seconds, r.note]
        .map(csvEscape)
        .join(","),
    ),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="pichacky-export.csv"',
    },
  });
}
