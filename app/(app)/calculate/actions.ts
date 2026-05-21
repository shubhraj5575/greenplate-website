"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  calculateIndividual,
  individualInputsSchema,
  type IndividualInputs,
} from "@/lib/calc/individual";

export async function submitIndividualCalc(inputs: IndividualInputs) {
  const parsed = individualInputsSchema.safeParse(inputs);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const result = calculateIndividual(parsed.data);
  const { data, error } = await supabase
    .from("calculations")
    .insert({
      user_id: user.id,
      calc_type: "individual_annual",
      inputs: parsed.data,
      breakdown: result.breakdown,
      total_kgco2e: result.annualKg,
    })
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/history");
  redirect(`/dashboard?from=${data.id}`);
}
