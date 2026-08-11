-- CreateEnum
CREATE TYPE "role" AS ENUM ('ADMIN', 'IT_USER');
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "complaint_status" AS ENUM ('PENDING', 'DEVICE_COLLECTED', 'ON_PROCESS', 'DONE', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "role" "role" NOT NULL DEFAULT 'IT_USER',
    "status" "user_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "complainer_name" TEXT NOT NULL,
    "complainer_designation" TEXT NOT NULL,
    "complainer_department" TEXT NOT NULL,
    "complainer_phone" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "device_model" TEXT,
    "device_serial" TEXT,
    "asset_id" TEXT,
    "location" TEXT,
    "priority" TEXT DEFAULT 'Normal',
    "complaint_details" TEXT NOT NULL,
    "current_status" "complaint_status" NOT NULL DEFAULT 'PENDING',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_status_history" (
    "id" TEXT NOT NULL,
    "complaint_id" TEXT NOT NULL,
    "previous_status" "complaint_status",
    "new_status" "complaint_status" NOT NULL,
    "remarks" TEXT,
    "changed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "related_complaint_id" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_ticket_counters" (
    "ticket_date" DATE NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_ticket_counters_pkey" PRIMARY KEY ("ticket_date")
);

-- CreateIndex (uniques)
CREATE UNIQUE INDEX "users_user_id_key" ON "users"("user_id");
CREATE UNIQUE INDEX "complaints_ticket_id_key" ON "complaints"("ticket_id");

-- CreateIndex (lookups)
CREATE INDEX "users_status_idx" ON "users"("status");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "complaints_current_status_idx" ON "complaints"("current_status");
CREATE INDEX "complaints_complainer_department_idx" ON "complaints"("complainer_department");
CREATE INDEX "complaints_created_at_idx" ON "complaints"("created_at");
CREATE INDEX "complaints_created_by_idx" ON "complaints"("created_by");
CREATE INDEX "complaint_status_history_complaint_id_idx" ON "complaint_status_history"("complaint_id");
CREATE INDEX "complaint_status_history_created_at_idx" ON "complaint_status_history"("created_at");
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "complaint_status_history" ADD CONSTRAINT "complaint_status_history_complaint_id_fkey"
    FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "complaint_status_history" ADD CONSTRAINT "complaint_status_history_changed_by_fkey"
    FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_related_complaint_id_fkey"
    FOREIGN KEY ("related_complaint_id") REFERENCES "complaints"("id") ON DELETE SET NULL ON UPDATE CASCADE;
