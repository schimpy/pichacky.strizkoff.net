"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = formData.get("name") as string;
  const color = (formData.get("color") as string) || "#3b82f6";

  await supabase.from("projects").insert({ user_id: user.id, name, color });
  revalidatePath("/tasks");
}

export async function archiveProject(id: string) {
  const supabase = await createClient();
  await supabase.from("projects").update({ archived: true }).eq("id", id);
  revalidatePath("/tasks");
}

export async function createTag(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = formData.get("name") as string;

  await supabase.from("tags").insert({ user_id: user.id, name });
  revalidatePath("/tasks");
}

export async function deleteTag(id: string) {
  const supabase = await createClient();
  await supabase.from("tags").delete().eq("id", id);
  revalidatePath("/tasks");
}

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = formData.get("name") as string;
  const projectId = formData.get("project_id") as string;
  const tagIds = formData.getAll("tag_ids") as string[];

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({ user_id: user.id, name, project_id: projectId || null })
    .select("id")
    .single();

  if (!error && task && tagIds.length > 0) {
    await supabase
      .from("task_tags")
      .insert(tagIds.map((tagId) => ({ task_id: task.id, tag_id: tagId })));
  }

  revalidatePath("/tasks");
}

export async function archiveTask(id: string) {
  const supabase = await createClient();
  await supabase.from("tasks").update({ archived: true }).eq("id", id);
  revalidatePath("/tasks");
}
