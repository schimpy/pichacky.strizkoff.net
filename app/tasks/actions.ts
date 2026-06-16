"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nejsi přihlášený.");
  return { supabase, user };
}

export async function createProject(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = formData.get("name") as string;
  const color = (formData.get("color") as string) || "#4f46e5";

  const { error } = await supabase.from("projects").insert({ user_id: user.id, name, color });
  if (error) throw new Error(`Nepodařilo se uložit projekt: ${error.message}`);
  revalidatePath("/tasks");
}

export async function archiveProject(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("projects").update({ archived: true }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}

export async function createTag(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = formData.get("name") as string;

  const { error } = await supabase.from("tags").insert({ user_id: user.id, name });
  if (error) throw new Error(`Nepodařilo se uložit tag: ${error.message}`);
  revalidatePath("/tasks");
}

export async function deleteTag(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}

export async function createTask(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = formData.get("name") as string;
  const projectId = formData.get("project_id") as string;
  const tagIds = formData.getAll("tag_ids") as string[];

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({ user_id: user.id, name, project_id: projectId || null })
    .select("id")
    .single();

  if (error) throw new Error(`Nepodařilo se uložit task: ${error.message}`);

  if (task && tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from("task_tags")
      .insert(tagIds.map((tagId) => ({ task_id: task.id, tag_id: tagId })));
    if (tagError) throw new Error(tagError.message);
  }

  revalidatePath("/tasks");
}

export async function archiveTask(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tasks").update({ archived: true }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}
