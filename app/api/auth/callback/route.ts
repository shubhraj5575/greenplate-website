import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // OAuth providers (e.g. Google "Cancel") send error params instead of a code.
  const oauthError = searchParams.get("error");
  const oauthErrorDesc = searchParams.get("error_description");
  if (oauthError) {
    const msg = oauthErrorDesc ?? oauthError;
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(msg)}`,
    );
  }

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? null;
  const type = searchParams.get("type"); // "recovery" for password-reset flow

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Collect cookies buffered by the Supabase client during the code exchange.
  // We use request.cookies (not next/headers cookies()) so we can explicitly
  // attach the Set-Cookie headers to every redirect response we return.
  // This is required because NextResponse.redirect() creates a new response
  // object and cookies set via cookieStore.set() from next/headers are NOT
  // automatically propagated to it in Next.js 16 Route Handlers.
  const buffered: Array<{ name: string; value: string; options: object }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          buffered.push(...cookiesToSet);
        },
      },
    },
  );

  // Helper that creates a redirect and attaches all buffered cookies.
  function redirect(url: string) {
    const res = NextResponse.redirect(url);
    buffered.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2]),
    );
    return res;
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  // Password-reset link — user is now in a recovery session.
  if (type === "recovery") {
    return redirect(`${origin}/reset-password`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect(`${origin}/login?error=no_user`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  const target =
    next ?? (profile?.onboarded_at ? "/dashboard" : "/onboarding");
  return redirect(`${origin}${target}`);
}
