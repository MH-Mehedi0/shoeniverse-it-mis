import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, isSessionResponse } from "@/lib/rbac";
import { updateUserSchema } from "@/lib/validation";
import { hashPassword, isStrongPassword } from "@/lib/auth";
import { logActivity, getClientIp } from "@/lib/activityLog";

// Deleting users is intentionally NOT implemented (rule #11 in the spec):
// historical complaints/history/activity rows reference users by id, so a
// hard delete would either cascade-destroy audit history or leave dangling
// references. Deactivation (status = INACTIVE) is the only supported path —
// it blocks login while keeping every past record intact and attributable.

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireRole("ADMIN");
  if (isSessionResponse(session)) return session;

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  // Guard against locking the system out of all admin accounts.
  if (
    target.role === "ADMIN" &&
    (data.status === "INACTIVE" || data.role === "IT_USER")
  ) {
    const activeAdmins = await prisma.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
    if (activeAdmins <= 1) {
      return NextResponse.json(
        { error: "Cannot deactivate or demote the last active Admin account." },
        { status: 400 }
      );
    }
  }

  let passwordHash: string | undefined;
  if (data.newPassword) {
    if (!isStrongPassword(data.newPassword)) {
      return NextResponse.json(
        { error: "Password must be 8+ characters with upper, lower, and a number." },
        { status: 400 }
      );
    }
    passwordHash = await hashPassword(data.newPassword);
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: {
      fullName: data.fullName,
      email: data.email || undefined,
      phone: data.phone || undefined,
      designation: data.designation,
      department: data.department,
      role: data.role,
      status: data.status,
      ...(passwordHash ? { passwordHash } : {}),
    },
    select: { id: true, fullName: true, userId: true, role: true, status: true },
  });

  const wasDeactivated = data.status === "INACTIVE" && target.status !== "INACTIVE";
  const wasReactivated = data.status === "ACTIVE" && target.status === "INACTIVE";

  await logActivity({
    userId: session.sub,
    action: passwordHash
      ? "PASSWORD_CHANGED"
      : wasDeactivated
        ? "USER_DEACTIVATED"
        : wasReactivated
          ? "USER_REACTIVATED"
          : "USER_UPDATED",
    description: `Updated user ${updated.userId}`,
    ipAddress: getClientIp(req),
  });

  return NextResponse.json(updated);
}
