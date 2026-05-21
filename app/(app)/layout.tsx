import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/onboarding/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type, full_name, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarded_at) redirect("/onboarding");
  const isOrg = profile.account_type === "organization";

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="sticky top-0 z-30 border-b border-forest-700/10 bg-cream-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="font-display text-xl text-forest-900">
            GreenPlate
          </Link>
          <nav className="hidden gap-6 text-sm text-ink-700 sm:flex">
            <Link href="/dashboard" className="hover:text-forest-900">
              Dashboard
            </Link>
            {isOrg ? (
              <>
                <Link href="/org/calculate" className="hover:text-forest-900">
                  Calculate
                </Link>
                <Link href="/org/menu" className="hover:text-forest-900">
                  Menu
                </Link>
              </>
            ) : (
              <Link href="/calculate" className="hover:text-forest-900">
                Calculate
              </Link>
            )}
            <Link href="/history" className="hover:text-forest-900">
              History
            </Link>
            <Link href="/settings" className="hover:text-forest-900">
              Settings
            </Link>
          </nav>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-pill border border-forest-700/15 px-4 py-1.5 text-sm text-ink-700 transition hover:border-forest-700/40"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
