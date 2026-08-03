/*
  Warnings:

  - The `status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `status` on the `applications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Result" AS ENUM ('SUCCESS', 'FAILURE');

-- AlterTable
ALTER TABLE "applications" ALTER COLUMN "client_secret_hash" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL,
ALTER COLUMN "launch_url" DROP NOT NULL;

-- AlterTable
ALTER TABLE "groups" ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "access_tokens" (
    "id" UUID NOT NULL,
    "jti" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "sso_session_id" UUID NOT NULL,
    "scopes" TEXT[],
    "status" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "actor_id" UUID,
    "user_id" UUID,
    "application_id" UUID,
    "session_id" UUID,
    "result" "Result" NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "access_tokens_jti_key" ON "access_tokens"("jti");
