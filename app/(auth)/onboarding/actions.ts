"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  account_type: z.enum(["individual", "organization"]),
  full_name: z.string().min(1).max(100),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  household_size: z.coerce.number().int().min(1).max(30).optional(),
  // org-only
  org_name: z.string().max(120).optional(),
  org_type: z
    .enum(["restaurant", "cafe", "cloud_kitchen", "bakery", "caterer", "other"])
    .optional(),
  org_employees: z.coerce.number().int().min(0).max(5000).optional(),
  org_seats: z.coerce.number().int().min(0).max(2000).optional(),
});

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  const { error: profErr } = await supabase.from("profiles").upsert({
    id: user.id,
    account_type: d.account_type,
    full_name: d.full_name,
    city: d.city ?? null,
    state: d.state ?? null,
    household_size:
      d.account_type === "individual" ? (d.household_size ?? 1) : null,
    onboarded_at: new Date().toISOString(),
  });
  if (profErr) return { ok: false, error: profErr.message };

  if (d.account_type === "organization") {
    if (!d.org_name || !d.org_type) {
      return { ok: false, error: "Organization name and type required." };
    }
    const baseSlug = slugify(d.org_name);
    const slug = `${baseSlug}-${user.id.slice(0, 6)}`;
    const { error: orgErr } = await supabase.from("organizations").insert({
      owner_id: user.id,
      name: d.org_name,
      slug,
      org_type: d.org_type,
      employees: d.org_employees ?? null,
      seats: d.org_seats ?? null,
      city: d.city ?? null,
      state: d.state ?? null,
    });
    if (orgErr) return { ok: false, error: orgErr.message };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
