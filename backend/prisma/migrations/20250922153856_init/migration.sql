-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'MANAGER');

-- CreateEnum
CREATE TYPE "public"."LocalStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "public"."TenantType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "public"."LeaseStatus" AS ENUM ('ACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('EMAIL', 'SMS', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."OwnerTable" AS ENUM ('LEASES', 'PAYMENTS');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Property" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Local" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "reference_code" TEXT NOT NULL,
    "floor" TEXT,
    "unit_type" TEXT,
    "size_m2" DOUBLE PRECISION,
    "status" "public"."LocalStatus" NOT NULL,

    CONSTRAINT "Local_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tenant" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."TenantType" NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lease" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "local_id" UUID NOT NULL,
    "lease_reference" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "rent_amount" DOUBLE PRECISION NOT NULL,
    "billing_cycle" "public"."BillingCycle" NOT NULL,
    "status" "public"."LeaseStatus" NOT NULL,

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PaymentMode" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "requires_proof" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PaymentMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" UUID NOT NULL,
    "lease_id" UUID NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_mode_id" UUID NOT NULL,
    "reference" TEXT,
    "status" "public"."PaymentStatus" NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" UUID NOT NULL,
    "owner_table" "public"."OwnerTable" NOT NULL,
    "owner_id" UUID NOT NULL,
    "file_key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" UUID NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "retries" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entity_table" TEXT,
    "entity_id" UUID,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Local_reference_code_key" ON "public"."Local"("reference_code");

-- CreateIndex
CREATE INDEX "Local_property_id_idx" ON "public"."Local"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "Lease_lease_reference_key" ON "public"."Lease"("lease_reference");

-- CreateIndex
CREATE INDEX "Lease_tenant_id_idx" ON "public"."Lease"("tenant_id");

-- CreateIndex
CREATE INDEX "Lease_local_id_idx" ON "public"."Lease"("local_id");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMode_code_key" ON "public"."PaymentMode"("code");

-- CreateIndex
CREATE INDEX "Payment_lease_id_idx" ON "public"."Payment"("lease_id");

-- CreateIndex
CREATE INDEX "Payment_payment_mode_id_idx" ON "public"."Payment"("payment_mode_id");

-- CreateIndex
CREATE INDEX "documents_owner_table_owner_id_idx" ON "public"."documents"("owner_table", "owner_id");

-- CreateIndex
CREATE INDEX "AuditLog_user_id_idx" ON "public"."AuditLog"("user_id");

-- AddForeignKey
ALTER TABLE "public"."Local" ADD CONSTRAINT "Local_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lease" ADD CONSTRAINT "Lease_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lease" ADD CONSTRAINT "Lease_local_id_fkey" FOREIGN KEY ("local_id") REFERENCES "public"."Local"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "public"."Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_payment_mode_id_fkey" FOREIGN KEY ("payment_mode_id") REFERENCES "public"."PaymentMode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_owner_id_lease_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_owner_id_payment_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
