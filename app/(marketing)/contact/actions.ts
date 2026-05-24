"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitContact(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("contact_submissions").insert({
    full_name: formData.get("name") as string,
    email: formData.get("email") as string,
    subject: formData.get("subject") as string,
    message: formData.get("message") as string,
  });
  redirect("/contact?sent=1");
}
