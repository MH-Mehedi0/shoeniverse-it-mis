/**
 * Development seed data.
 *
 * Run with: npm run seed
 *
 * Creates:
 *  - One Admin account (credentials from env — see .env.example)
 *  - Three sample IT User accounts
 *  - Sample complaints covering all 5 statuses, with realistic status
 *    history (so the timeline UI has something to show)
 *
 * Safe to re-run: uses upsert on the unique user_id, and clears previously
 * seeded complaints (identified by a "SEED-" prefix marker in remarks)
 * before re-creating them, so it won't pile up duplicates in dev.
 *
 * Remove or replace this file's data before deploying to production —
 * see README.md "Seed Data" section.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  const adminUserId = process.env.SEED_ADMIN_USER_ID ?? "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminFullName = process.env.SEED_ADMIN_FULL_NAME ?? "System Administrator";

  if (!adminPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is not set. Set it in your .env before running the seed script — never hardcode a real admin password in source."
    );
  }

  const admin = await prisma.user.upsert({
    where: { userId: adminUserId },
    update: {},
    create: {
      fullName: adminFullName,
      userId: adminUserId,
      passwordHash: await hash(adminPassword),
      role: "ADMIN",
      status: "ACTIVE",
      department: "IT",
      designation: "System Administrator",
    },
  });
  console.log(`✓ Admin ready: ${admin.userId}`);

  const sampleItUsers = [
    { userId: "it.mehedi", fullName: "MD. Mehedi Hasan", designation: "IT Officer" },
    { userId: "it.nasim", fullName: "Nasim Mia", designation: "IT Support Engineer" },
    { userId: "it.jannatul", fullName: "Jannatul Ferdous Aksh", designation: "IT Support Engineer" },
  ];

  const itUsers = [];
  for (const u of sampleItUsers) {
    const user = await prisma.user.upsert({
      where: { userId: u.userId },
      update: {},
      create: {
        fullName: u.fullName,
        userId: u.userId,
        passwordHash: await hash("ChangeMe123"), // dev-only default; change on first login
        role: "IT_USER",
        status: "ACTIVE",
        department: "IT",
        designation: u.designation,
      },
    });
    itUsers.push(user);
  }
  console.log(`✓ ${itUsers.length} sample IT users ready`);

  // Clear previously seeded complaints (marker-based, so re-running seed
  // in dev doesn't accumulate duplicates). Cascades to status history.
  const deleted = await prisma.complaint.deleteMany({
    where: { complaintDetails: { startsWith: "[SEED]" } },
  });
  if (deleted.count) console.log(`  (cleared ${deleted.count} previously seeded complaints)`);

  const seedComplaints: Array<{
    ticketId: string;
    complainerName: string;
    complainerDesignation: string;
    complainerDepartment: string;
    complainerPhone: string;
    deviceName: string;
    deviceModel?: string;
    complaintDetails: string;
    finalStatus: "PENDING" | "DEVICE_COLLECTED" | "ON_PROCESS" | "DONE" | "CANCELLED";
  }> = [
    {
      ticketId: "IT-20260801-0001",
      complainerName: "Farhana Akter",
      complainerDesignation: "Merchandiser",
      complainerDepartment: "Merchandising",
      complainerPhone: "01711000001",
      deviceName: "Laptop",
      deviceModel: "Dell Latitude 5420",
      complaintDetails: "[SEED] Laptop won't power on after last night's shutdown. No lights, no fan noise.",
      finalStatus: "PENDING",
    },
    {
      ticketId: "IT-20260802-0001",
      complainerName: "Kamrul Hasan",
      complainerDesignation: "Accounts Officer",
      complainerDepartment: "Finance",
      complainerPhone: "01711000002",
      deviceName: "Printer",
      deviceModel: "HP LaserJet M404",
      complaintDetails: "[SEED] Printer jams on every print job, paper feeds crooked.",
      finalStatus: "DEVICE_COLLECTED",
    },
    {
      ticketId: "IT-20260803-0001",
      complainerName: "Sultana Razia",
      complainerDesignation: "HR Executive",
      complainerDepartment: "Human Resources",
      complainerPhone: "01711000003",
      deviceName: "Desktop",
      deviceModel: "HP ProDesk 400",
      complaintDetails: "[SEED] Desktop restarts randomly, roughly twice a day, no error message shown.",
      finalStatus: "ON_PROCESS",
    },
    {
      ticketId: "IT-20260804-0001",
      complainerName: "Abdur Rahim",
      complainerDesignation: "Store Manager",
      complainerDepartment: "Warehouse",
      complainerPhone: "01711000004",
      deviceName: "Router",
      complaintDetails: "[SEED] Warehouse wifi router keeps dropping connection for the barcode scanners.",
      finalStatus: "DONE",
    },
    {
      ticketId: "IT-20260805-0001",
      complainerName: "Nusrat Jahan",
      complainerDesignation: "Marketing Executive",
      complainerDepartment: "Marketing",
      complainerPhone: "01711000005",
      deviceName: "Monitor",
      complaintDetails: "[SEED] External monitor flickers intermittently, suspected loose HDMI cable.",
      finalStatus: "CANCELLED",
    },
  ];

  const statusOrder = ["PENDING", "DEVICE_COLLECTED", "ON_PROCESS", "DONE", "CANCELLED"] as const;

  for (const c of seedComplaints) {
    const creator = itUsers[Math.floor(Math.random() * itUsers.length)];

    const complaint = await prisma.complaint.create({
      data: {
        ticketId: c.ticketId,
        complainerName: c.complainerName,
        complainerDesignation: c.complainerDesignation,
        complainerDepartment: c.complainerDepartment,
        complainerPhone: c.complainerPhone,
        deviceName: c.deviceName,
        deviceModel: c.deviceModel,
        complaintDetails: c.complaintDetails,
        currentStatus: "PENDING", // trigger writes the initial history row
        createdById: creator.id,
      },
    });

    // Walk the status forward to the target final status, updating
    // through the DB trigger each time so realistic history accumulates
    // (rather than inserting history rows directly, which would bypass
    // the exact mechanism this system relies on in production).
    const targetIndex = statusOrder.indexOf(c.finalStatus);
    for (let i = 1; i <= targetIndex; i++) {
      const actor = itUsers[Math.floor(Math.random() * itUsers.length)];
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_user_id', ${actor.id}, true)`;
        await tx.$executeRaw`SELECT set_config('app.status_remarks', ${"Seed data progression"}, true)`;
        await tx.complaint.update({
          where: { id: complaint.id },
          data: { currentStatus: statusOrder[i] },
        });
      });
    }
  }
  console.log(`✓ ${seedComplaints.length} sample complaints seeded (all 5 statuses represented)`);

  console.log("\nSeed complete.");
  console.log(`  Admin login:    ${adminUserId} / (SEED_ADMIN_PASSWORD from .env)`);
  console.log(`  IT user login:  it.mehedi / ChangeMe123  (and 2 more — change on first login)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
