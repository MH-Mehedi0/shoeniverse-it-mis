import { PrismaClient, Prisma } from "@prisma/client";

// Standard Next.js dev-mode singleton (avoids exhausting DB connections
// on hot reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Runs `fn` inside a transaction with two Postgres session variables set
 * (app.current_user_id, app.status_remarks), which the
 * log_complaint_status_change() trigger reads to attribute status-history
 * rows to the acting user. This is the ONLY sanctioned way to write to
 * complaints.currentStatus — every API route that changes status must go
 * through this, so the DB-level trigger and the app-level "who did this"
 * context stay in sync.
 *
 * SET LOCAL is transaction-scoped and resets automatically at COMMIT/ROLLBACK,
 * so there's no risk of leaking one request's actor into another connection
 * from the pool.
 */
export async function withActor<T>(
  actorUserId: string | null,
  remarks: string | null,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Parameterized via Prisma's tagged-template $executeRaw — safe from
    // injection even though these are session variables, not row data.
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${actorUserId ?? ""}, true)`;
    await tx.$executeRaw`SELECT set_config('app.status_remarks', ${remarks ?? ""}, true)`;
    return fn(tx);
  });
}
