"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function computeDuration(start: string, end: string) {
  return Math.max(
    0,
    Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000),
  );
}

export async function createTimeEntry(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nejsi přihlášený.");

  const taskId = formData.get("task_id") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const note = (formData.get("note") as string) || null;

  const startedAt = new Date(`${date}T${startTime}`).toISOString();
  const endedAt = new Date(`${date}T${endTime}`).toISOString();

  const { error } = await supabase.from("time_entries").insert({
    user_id: user.id,
    task_id: taskId,
    started_at: startedAt,
    ended_at: endedAt,
    duration_seconds: computeDuration(startedAt, endedAt),
    note,
  });
  if (error) throw new Error(`Nepodařilo se uložit záznam: ${error.message}`);

  revalidatePath("/history");
  revalidatePath("/");
}

export async function updateTimeEntry(id: string, formData: FormData) {
  const supabase = await createClient();

  const date = formData.get("date") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const note = (formData.get("note") as string) || null;

  const startedAt = new Date(`${date}T${startTime}`).toISOString();
  const endedAt = new Date(`${date}T${endTime}`).toISOString();

  const { error } = await supabase
    .from("time_entries")
    .update({
      started_at: startedAt,
      ended_at: endedAt,
      duration_seconds: computeDuration(startedAt, endedAt),
      note,
    })
    .eq("id", id);
  if (error) throw new Error(`Nepodařilo se upravit záznam: ${error.message}`);

  revalidatePath("/history");
  revalidatePath("/");
}

export async function deleteTimeEntry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/history");
  revalidatePath("/");
}
