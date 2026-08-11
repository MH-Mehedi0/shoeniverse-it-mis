import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, isSessionResponse } from "@/lib/rbac";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 40;

export async function GET(req: NextRequest) {
  const session = await requireRole("ADMIN");
  if (isSessionResponse(session)) return session;

  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId");
  const action = searchParams.get("action");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const where: Prisma.ActivityLogWhereInput = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
    };
  }

  const [total, logs] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { fullName: true, userId: true } },
        relatedComplaint: { select: { ticketId: true } },
      },
    }),
  ]);

  return NextResponse.json({
    data: logs,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) || 1 },
  });
}
