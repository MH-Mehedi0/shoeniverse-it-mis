import { NextResponse } from "next/server";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";

export async function POST() {
  const session = await getSession();
  if (session) {
    await logActivity({ userId: session.sub, action: "LOGOUT" });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
