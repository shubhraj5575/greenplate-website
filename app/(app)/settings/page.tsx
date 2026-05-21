import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/onboarding/actions";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, full_name, city, state, household_size")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-4xl text-forest-900">Settings</h1>

      <section className="mt-10 rounded-card border border-forest-700/10 bg-bone-100 p-6">
        <h2 className="font-display text-xl text-forest-900">Profile</h2>
        <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-ink-500">Email</dt>
          <dd className="text-ink-900">{user.email}</dd>
          <dt className="text-ink-500">Name</dt>
          <dd className="text-ink-900">{profile?.full_name ?? "—"}</dd>
          <dt className="text-ink-500">Type</dt>
          <dd className="text-ink-900 capitalize">{profile?.account_type ?? "—"}</dd>
          <dt className="text-ink-500">Location</dt>
          <dd className="text-ink-900">
            {[profile?.city, profile?.state].filter(Boolean).join(", ") || "—"}
          </dd>
          {profile?.account_type === "individual" && (
            <>
              <dt className="text-ink-500">Household size</dt>
              <dd className="text-ink-900">{profile?.household_size ?? 1}</dd>
            </>
          )}
        </dl>
        <p className="mt-6 text-xs text-ink-400">
          Profile editing UI ships in a follow-up build. For now, contact{" "}
          <a href="mailto:hello@greenplate.in" className="underline">
            hello@greenplate.in
          </a>{" "}
          to update.
        </p>
      </section>

      <section className="mt-6 rounded-card border border-danger/30 bg-danger/5 p-6">
        <h2 className="font-display text-xl text-danger">Sign out</h2>
        <p className="mt-2 text-sm text-ink-500">
          You can sign back in any time — your saved calculations stay put.
        </p>
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="rounded-full border border-danger/30 px-5 py-2 text-sm text-danger transition hover:bg-danger/10"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
