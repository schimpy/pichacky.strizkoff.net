"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function durationSeconds(start: string, end: Date) {
  return Math.round((end.getTime() - new Date(start).getTime()) / 1000);
}

export async function startTimer(taskId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nejsi přihlášený.");

  const { data: running } = await supabase
    .from("time_entries")
    .select("id, started_at")
    .is("ended_at", null)
    .maybeSingle();

  if (running) {
    const endedAt = new Date();
    await supabase
      .from("time_entries")
      .update({
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds(running.started_at, endedAt),
      })
      .eq("id", running.id);
  }

  const { error } = await supabase.from("time_entries").insert({
    user_id: user.id,
    task_id: taskId,
    started_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Nepodařilo se spustit časovač: ${error.message}`);

  revalidatePath("/");
}

export async function stopTimer(entryId: string) {
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("time_entries")
    .select("started_at")
    .eq("id", entryId)
    .single();

  if (!entry) return;

  const endedAt = new Date();
  const { error } = await supabase
    .from("time_entries")
    .update({
      ended_at: endedAt.toISOString(),
      duration_seconds: durationSeconds(entry.started_at, endedAt),
    })
    .eq("id", entryId);
  if (error) throw new Error(`Nepodařilo se zastavit časovač: ${error.message}`);

  revalidatePath("/");
}
