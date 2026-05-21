import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/auth/OnboardingForm";

export const metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.onboarded_at) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-medium tracking-widest text-forest-700 uppercase">
          Welcome
        </p>
        <h1 className="mt-2 font-display text-4xl text-forest-900">
          Tell us who&apos;s measuring.
        </h1>
        <p className="mt-3 text-ink-500">
          Two minutes. Your details stay yours — used only to compute and store
          your footprint.
        </p>
      </header>
      <OnboardingForm
        defaultName={user.user_metadata?.full_name ?? ""}
        defaultEmail={user.email ?? ""}
      />
    </main>
  );
}
