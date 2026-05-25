import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Matches the Supabase session cookie and its chunked variants
// (sb-<ref>-auth-token, sb-<ref>-auth-token.0, .1, …) but NOT the PKCE
// verifier cookie sb-<ref>-auth-token-code-verifier. Same shape as proxy.ts.
const SESSION_COOKIE = /^sb-.+-auth-token(\.\d+)?$/;

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const next = searchParams.get("next");

  // Stale session cookies from any prior sign-in attempt — we explicitly
  // delete these on the redirect to Google so this PKCE handshake starts
  // from a clean slate. Without this, a user whose previous session is
  // chunked (e.g. previous Google sign-in produced .0/.1, new sign-in
  // produces single un-chunked) can end up with shadowed cookies that
  // confuse later requests.
  const staleSessionCookies = request.cookies
    .getAll()
    .filter((c) => SESSION_COOKIE.test(c.name))
    .map((c) => c.name);

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

  const callbackUrl = `${origin}/api/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error?.message ?? "Google sign-in failed")}`,
    );
  }

  const res = NextResponse.redirect(data.url);
  // Expire any stale session cookies before setting the new PKCE verifier,
  // so the browser drops them on this same response.
  staleSessionCookies.forEach((name) => res.cookies.delete(name));
  buffered.forEach(({ name, value, options }) =>
    res.cookies.set(
      name,
      value,
      options as Parameters<typeof res.cookies.set>[2],
    ),
  );
  return res;
}
