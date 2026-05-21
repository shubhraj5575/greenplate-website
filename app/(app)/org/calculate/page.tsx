import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OrgWizard } from "@/components/calc/OrgWizard";

export const metadata = { title: "Org calculator" };

export default async function OrgCalculatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, seats, employees")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!org) redirect("/onboarding");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
          {org.name}
        </p>
        <h1 className="mt-2 font-display text-4xl text-forest-900">
          Organization footprint.
        </h1>
        <p className="mt-3 text-ink-500">
          Scope 1 / 2 / 3 breakdown per GHG Protocol. Five steps — kitchen
          combustion, electricity, menu, logistics, packaging &amp; commute.
        </p>
      </header>
      <OrgWizard
        orgId={org.id}
        seats={org.seats ?? 0}
        employees={org.employees ?? 0}
      />
    </main>
  );
}
