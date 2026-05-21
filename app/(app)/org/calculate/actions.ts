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
