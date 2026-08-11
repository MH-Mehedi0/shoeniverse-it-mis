import type { Prisma } from "@prisma/client";

/** Returns today's date in Asia/Dhaka as YYYY-MM-DD, independent of server TZ. */
function todayInDhaka(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/**
 * Atomically reserves the next ticket number for today and returns a
 * formatted ticket id like IT-20260810-0001.
 *
 * MUST be called inside the same transaction as the complaint INSERT
 * (see api/complaints/route.ts). The INSERT ... ON CONFLICT DO UPDATE
 * with RETURNING is a single round trip, so two concurrent requests
 * racing for the same day serialize on the row lock instead of
 * colliding on the unique ticket_id constraint — no retry loop needed.
 */
export async function reserveNextTicketId(tx: Prisma.TransactionClient): Promise<string> {
  const dateKey = todayInDhaka();

  const rows = await tx.$queryRaw<{ last_number: number }[]>`
    INSERT INTO daily_ticket_counters (ticket_date, last_number)
    VALUES (${dateKey}::date, 1)
    ON CONFLICT (ticket_date)
    DO UPDATE SET last_number = daily_ticket_counters.last_number + 1
    RETURNING last_number;
  `;

  const seq = rows[0].last_number;
  const compact = dateKey.replace(/-/g, ""); // YYYYMMDD
  const padded = String(seq).padStart(4, "0");
  return `IT-${compact}-${padded}`;
}
