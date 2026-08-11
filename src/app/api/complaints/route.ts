import { NextRequest, NextResponse } from "next/server";
import { prisma, withActor } from "@/lib/db";
import { requireSession, isSessionResponse } from "@/lib/rbac";
import { createComplaintSchema } from "@/lib/validation";
import { reserveNextTicketId } from "@/lib/ticketId";
import { logActivity, getClientIp } from "@/lib/activityLog";
import type { Prisma, ComplaintStatus } from "@prisma/client";

const PAGE_SIZE = 20;

// Any authenticated user (Admin or IT User) can view the shared complaint
// queue — this is a 2-5 person IT team working one shared ticket list,
// not a system where agents only see "their own" tickets.
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (isSessionResponse(session)) return session;

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status") as ComplaintStatus | null;
  const department = searchParams.get("department")?.trim();
  const createdBy = searchParams.get("createdBy")?.trim();
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

  const where: Prisma.ComplaintWhereInput = {};
  if (status) where.currentStatus = status;
  if (department) where.complainerDepartment = { equals: department, mode: "insensitive" };
  if (createdBy) where.createdById = createdBy;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
    };
  }
  if (q) {
    where.OR = [
      { ticketId: { contains: q, mode: "insensitive" } },
      { complainerName: { contains: q, mode: "insensitive" } },
      { complainerDepartment: { contains: q, mode: "insensitive" } },
      { complainerPhone: { contains: q, mode: "insensitive" } },
      { deviceName: { contains: q, mode: "insensitive" } },
      { deviceModel: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, complaints] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { createdBy: { select: { fullName: true, userId: true } } },
    }),
  ]);

  return NextResponse.json({
    data: complaints,
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages: Math.ceil(total / PAGE_SIZE) || 1 },
  });
}

export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (isSessionResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const parsed = createComplaintSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const complaint = await withActor(session.sub, "Complaint created", async (tx) => {
      const ticketId = await reserveNextTicketId(tx);
      return tx.complaint.create({
        data: {
          ticketId,
          complainerName: data.complainerName,
          complainerDesignation: data.complainerDesignation,
          complainerDepartment: data.complainerDepartment,
          complainerPhone: data.complainerPhone,
          deviceName: data.deviceName,
          deviceModel: data.deviceModel,
          deviceSerial: data.deviceSerial,
          assetId: data.assetId,
          location: data.location,
          priority: data.priority ?? "Normal",
          complaintDetails: data.complaintDetails,
          currentStatus: "PENDING",
          createdById: session.sub,
        },
      });
      // Note: the AFTER INSERT trigger (see prisma/migrations/..._status_history_trigger)
      // writes the initial PENDING history row automatically, attributed to
      // session.sub via the SET LOCAL app.current_user_id set by withActor().
    });

    await logActivity(
      {
        userId: session.sub,
        action: "COMPLAINT_CREATED",
        description: `Created ${complaint.ticketId}`,
        relatedComplaintId: complaint.id,
        ipAddress: getClientIp(req),
      },
      prisma
    );

    return NextResponse.json(complaint, { status: 201 });
  } catch (err: any) {
    // Should be effectively unreachable given reserveNextTicketId's locking,
    // but the unique constraint remains the last line of defense.
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "Ticket ID collision, please retry." }, { status: 409 });
    }
    console.error("Complaint creation failed:", err);
    return NextResponse.json({ error: "Could not create complaint." }, { status: 500 });
  }
}
