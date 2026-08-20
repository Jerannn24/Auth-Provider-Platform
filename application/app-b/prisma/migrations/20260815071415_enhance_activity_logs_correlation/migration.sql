/*
  Warnings:

  - Added the required column `action` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `correlation_id` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `request_id` to the `activity_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `activity_logs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateEnum
CREATE TYPE "ActivityActorType" AS ENUM ('SYSTEM', 'USER');

-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "action" TEXT NOT NULL,
ADD COLUMN     "actor_type" "ActivityActorType" NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN     "correlation_id" UUID NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "performed_by" UUID,
ADD COLUMN     "relation_type" TEXT,
ADD COLUMN     "request_id" UUID NOT NULL,
ADD COLUMN     "status" "ActivityStatus" NOT NULL,
ALTER COLUMN "relation_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "activity_logs_correlation_id_performed_at_idx" ON "activity_logs"("correlation_id", "performed_at");

-- CreateIndex
CREATE INDEX "activity_logs_request_id_idx" ON "activity_logs"("request_id");

-- CreateIndex
CREATE INDEX "activity_logs_action_performed_at_idx" ON "activity_logs"("action", "performed_at");
