import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const next = searchParams.get("next");

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
  buffered.forEach(({ name, value, options }) =>
    res.cookies.set(
      name,
      value,
      options as Parameters<typeof res.cookies.set>[2],
    ),
  );
  return res;
}
