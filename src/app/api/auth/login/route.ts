import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { logActivity, getClientIp } from "@/lib/activityLog";

// Simple in-memory failed-attempt tracker. Fine at this scale (single
// instance, small user base); for a multi-instance deployment this would
// need to move to the database or a shared store.
const failedAttempts = new Map<string, { count: number; lockedUntil?: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { userId, password } = parsed.data;
  const ip = getClientIp(req);

  const attempt = failedAttempts.get(userId);
  if (attempt?.lockedUntil && attempt.lockedUntil > Date.now()) {
    const minutes = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${minutes} minute(s).` },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({ where: { userId } });

  const fail = async (reason: string) => {
    const current = failedAttempts.get(userId) ?? { count: 0 };
    current.count += 1;
    if (current.count >= MAX_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCKOUT_MS;
      current.count = 0;
    }
    failedAttempts.set(userId, current);
    await logActivity({
      userId: user?.id ?? null,
      action: "LOGIN_FAILED",
      description: `${reason} (user_id attempted: ${userId})`,
      ipAddress: ip,
    });
  };

  if (!user || user.status !== "ACTIVE") {
    await fail(user ? "Inactive account" : "Unknown user_id");
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    await fail("Wrong password");
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  failedAttempts.delete(userId);

  const token = await createSessionToken({
    sub: user.id,
    userId: user.userId,
    role: user.role,
    fullName: user.fullName,
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
  await logActivity({ userId: user.id, action: "LOGIN", ipAddress: ip });

  const res = NextResponse.json({
    id: user.id,
    userId: user.userId,
    fullName: user.fullName,
    role: user.role,
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
