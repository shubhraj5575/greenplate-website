"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function renameCalculation(id: string, name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("calculations")
    .update({ name: name.trim() || null })
    .eq("id", id)
    .eq("user_id", user.id); // RLS-scoped

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/history");
  return { ok: true as const };
}
