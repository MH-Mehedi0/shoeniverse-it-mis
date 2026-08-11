import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// NOTE: this is a UX convenience (fast redirect, no flash of protected
// content). It is NOT the security boundary — every API route independently
// re-checks the session and role via src/lib/rbac.ts, because middleware
// can be bypassed by calling the API directly.

const SESSION_COOKIE = "shoeniverse_session";
const ADMIN_ONLY_PREFIXES = ["/dashboard/users", "/dashboard/activity"];

async function verify(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { role?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/dashboard")) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verify(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard?error=forbidden", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
