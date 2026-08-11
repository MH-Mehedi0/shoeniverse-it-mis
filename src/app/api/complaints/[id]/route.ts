import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, isSessionResponse } from "@/lib/rbac";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (isSessionResponse(session)) return session;

  const complaint = await prisma.complaint.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { fullName: true, userId: true } },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { fullName: true, userId: true } } },
      },
    },
  });

  if (!complaint) {
    return NextResponse.json({ error: "Complaint not found." }, { status: 404 });
  }
  return NextResponse.json(complaint);
}
