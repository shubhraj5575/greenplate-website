import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase OAuth callback — exchanges the `code` param for a session
// then redirects to the `next` page (defaults to /onboarding for first-time,
// /dashboard for returning users).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? null;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Find out if profile exists; route to onboarding if not.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?error=no_user`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  const target =
    next ?? (profile?.onboarded_at ? "/dashboard" : "/onboarding");
  return NextResponse.redirect(`${origin}${target}`);
}
