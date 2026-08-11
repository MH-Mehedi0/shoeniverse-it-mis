import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, isSessionResponse } from "@/lib/rbac";

export async function GET() {
  const session = await requireSession();
  if (isSessionResponse(session)) return session;

  const [statusCounts, totalComplaints, totalUsers, activeUsers, byDepartment, byMonthRaw] =
    await Promise.all([
      prisma.complaint.groupBy({ by: ["currentStatus"], _count: true }),
      prisma.complaint.count(),
      session.role === "ADMIN" ? prisma.user.count() : Promise.resolve(null),
      session.role === "ADMIN" ? prisma.user.count({ where: { status: "ACTIVE" } }) : Promise.resolve(null),
      prisma.complaint.groupBy({ by: ["complainerDepartment"], _count: true, orderBy: { _count: { complainerDepartment: "desc" } }, take: 8 }),
      prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*) AS count
        FROM complaints
        WHERE created_at > NOW() - INTERVAL '6 months'
        GROUP BY 1
        ORDER BY 1 ASC;
      `,
    ]);

  const statusMap: Record<string, number> = {
    PENDING: 0,
    DEVICE_COLLECTED: 0,
    ON_PROCESS: 0,
    DONE: 0,
    CANCELLED: 0,
  };
  for (const row of statusCounts) statusMap[row.currentStatus] = row._count;

  return NextResponse.json({
    totalComplaints,
    statusCounts: statusMap,
    totalUsers,
    activeUsers,
    byDepartment: byDepartment.map((d) => ({ department: d.complainerDepartment, count: d._count })),
    byMonth: byMonthRaw.map((r) => ({ month: r.month, count: Number(r.count) })),
  });
}
