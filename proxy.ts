import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Next.js 16: proxy runs on Node.js runtime (not Edge).
// The recommended pattern is optimistic cookie checks only — no network calls.
// Real session validation happens in Server Components via supabase.auth.getUser().
// See: node_modules/next/dist/docs/01-app/02-guides/authentication.md

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/calculate",
  "/org/",
  "/history",
  "/settings",
  "/onboarding",
];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Optimistic check: Supabase stores the session in a cookie named
  // sb-<projectRef>-auth-token. We check for its presence — expiry/validity
  // is verified by supabase.auth.getUser() inside each Server Component.
  const hasSession = request.cookies
    .getAll()
    .some(
      (c) =>
        c.name.startsWith("sb-") &&
        c.name.endsWith("-auth-token") &&
        c.value.length > 0,
    );

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect_to", pathname);
    return NextResponse.redirect(url);
  }

  // Logged-in users hitting /login go to dashboard (optimistic)
  if (pathname === "/login" && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
