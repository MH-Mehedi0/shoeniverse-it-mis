import { NextResponse } from "next/server";
import { getSession, SessionPayload } from "./auth";
import type { Role } from "@prisma/client";

/**
 * Server-side authorization guard for API route handlers.
 *
 * This — not the UI hiding a button — is the actual security boundary.
 * Every route that reads/writes non-public data must call this first.
 * Returns either the verified session, or a NextResponse to return
 * immediately (so callers can do: `const s = await requireRole(...); if (s instanceof NextResponse) return s;`)
 */
export async function requireSession(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  return session;
}

export async function requireRole(...allowed: Role[]): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!allowed.includes(session.role)) {
    return NextResponse.json({ error: "Not authorized for this action." }, { status: 403 });
  }
  return session;
}

export function isSessionResponse(x: SessionPayload | NextResponse): x is NextResponse {
  return x instanceof NextResponse;
}
