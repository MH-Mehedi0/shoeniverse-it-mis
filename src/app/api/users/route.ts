import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, isSessionResponse } from "@/lib/rbac";
import { createUserSchema } from "@/lib/validation";
import { hashPassword, isStrongPassword } from "@/lib/auth";
import { logActivity, getClientIp } from "@/lib/activityLog";

export async function GET() {
  const session = await requireRole("ADMIN");
  if (isSessionResponse(session)) return session;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      userId: true,
      email: true,
      phone: true,
      designation: true,
      department: true,
      role: true,
      status: true,
      createdAt: true,
      lastLogin: true,
    },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await requireRole("ADMIN");
  if (isSessionResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (!isStrongPassword(data.password)) {
    return NextResponse.json(
      { error: "Password must be 8+ characters with upper, lower, and a number." },
      { status: 400 }
    );
  }

  const exists = await prisma.user.findUnique({ where: { userId: data.userId } });
  if (exists) {
    return NextResponse.json({ error: "That User ID is already taken." }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      userId: data.userId,
      passwordHash,
      email: data.email || undefined,
      phone: data.phone || undefined,
      designation: data.designation,
      department: data.department,
      role: data.role,
      status: data.status,
    },
    select: { id: true, fullName: true, userId: true, role: true, status: true },
  });

  await logActivity({
    userId: session.sub,
    action: "USER_CREATED",
    description: `Created user ${user.userId} (${user.role})`,
    ipAddress: getClientIp(req),
  });

  return NextResponse.json(user, { status: 201 });
}
