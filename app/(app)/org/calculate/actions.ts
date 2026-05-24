"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  calculateOrganization,
  orgInputsSchema,
  type OrgInputs,
} from "@/lib/calc/organization";

export async function submitOrgCalc(orgId: string, inputs: OrgInputs) {
  const parsed = orgInputsSchema.safeParse(inputs);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const result = calculateOrganization(parsed.data);
  const { data, error } = await supabase
    .from("calculations")
    .insert({
      user_id: user.id,
      org_id: orgId,
      calc_type: "org_annual",
      inputs: parsed.data,
      breakdown: result.breakdown,
      total_kgco2e: result.annualKg,
      scope1_kgco2e: result.scope1Kg,
      scope2_kgco2e: result.scope2Kg,
      scope3_kgco2e: result.scope3Kg,
    })
    .select("id")
    .single();
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/history");
  redirect(`/dashboard?from=${data.id}`);
}

export async function searchFoodItems(q: string): Promise<Array<{
  id: string;
  display_name: string;
  category: string;
  kgco2e_per_kg: number;
  geographic_scope: string | null;
}>> {
  if (!q || q.trim().length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("food_items")
    .select("id, display_name, category, kgco2e_per_kg, geographic_scope")
    .ilike("display_name", `%${q.trim()}%`)
    .eq("active", true)
    .order("display_name")
    .limit(20);
  return (data ?? []).map(r => ({
    id: r.id,
    display_name: r.display_name,
    category: r.category,
    kgco2e_per_kg: Number(r.kgco2e_per_kg),
    geographic_scope: r.geographic_scope,
  }));
}
