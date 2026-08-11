import { NextRequest, NextResponse } from "next/server";
import { prisma, withActor } from "@/lib/db";
import { requireSession, isSessionResponse } from "@/lib/rbac";
import { updateStatusSchema } from "@/lib/validation";
import { logActivity, getClientIp } from "@/lib/activityLog";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (isSessionResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const parsed = updateStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { newStatus, remarks } = parsed.data;

  const existing = await prisma.complaint.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
  }
  if (existing.currentStatus === newStatus) {
    return NextResponse.json({ error: "Complaint is already in that status." }, { status: 400 });
  }

  // withActor sets the SET LOCAL session variables the DB trigger reads,
  // then the plain UPDATE below is all that's needed — the trigger writes
  // the complaint_status_history row atomically in the same transaction.
  // There is no separate "insert history" call here by design: that's the
  // whole point of enforcing this invariant at the database layer.
  const updated = await withActor(session.sub, remarks ?? null, (tx) =>
    tx.complaint.update({
      where: { id: params.id },
      data: { currentStatus: newStatus },
    })
  );

  await logActivity(
    {
      userId: session.sub,
      action: "COMPLAINT_STATUS_CHANGED",
      description: `${existing.currentStatus} → ${newStatus}${remarks ? `: ${remarks}` : ""}`,
      relatedComplaintId: updated.id,
      ipAddress: getClientIp(req),
    },
    prisma
  );

  return NextResponse.json(updated);
}
