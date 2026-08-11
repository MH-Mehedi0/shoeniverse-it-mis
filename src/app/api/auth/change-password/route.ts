import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, isSessionResponse } from "@/lib/rbac";
import { verifyPassword, hashPassword, isStrongPassword } from "@/lib/auth";
import { logActivity, getClientIp } from "@/lib/activityLog";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (isSessionResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed.data;

  if (!isStrongPassword(newPassword)) {
    return NextResponse.json(
      { error: "New password must be 8+ characters with upper, lower, and a number." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await logActivity({
    userId: user.id,
    action: "PASSWORD_CHANGED",
    description: "Self-service password change",
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
