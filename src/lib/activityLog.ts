import { prisma } from "./db";
import type { Prisma } from "@prisma/client";

export type ActivityAction =
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "COMPLAINT_CREATED"
  | "COMPLAINT_UPDATED"
  | "COMPLAINT_STATUS_CHANGED"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DEACTIVATED"
  | "USER_REACTIVATED"
  | "PASSWORD_CHANGED";

export async function logActivity(
  params: {
    userId: string | null;
    action: ActivityAction;
    description?: string;
    relatedComplaintId?: string;
    ipAddress?: string | null;
  },
  client: Prisma.TransactionClient | typeof prisma = prisma
) {
  await client.activityLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      description: params.description,
      relatedComplaintId: params.relatedComplaintId,
      ipAddress: params.ipAddress ?? undefined,
    },
  });
}

/** Best-effort client IP extraction behind common proxies/load balancers. */
export function getClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}
