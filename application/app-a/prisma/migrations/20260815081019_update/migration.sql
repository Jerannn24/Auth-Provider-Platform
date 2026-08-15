/*
  Warnings:

  - You are about to drop the column `action` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `actor_type` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `performed_by` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `relation_id` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `relation_type` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `request_id` on the `activity_logs` table. All the data in the column will be lost.
  - Added the required column `state` to the `activity_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "activity_logs_action_performed_at_idx";

-- DropIndex
DROP INDEX "activity_logs_request_id_idx";

-- AlterTable
ALTER TABLE "activity_logs" DROP COLUMN "action",
DROP COLUMN "actor_type",
DROP COLUMN "performed_by",
DROP COLUMN "relation_id",
DROP COLUMN "relation_type",
DROP COLUMN "request_id",
ADD COLUMN     "state" TEXT NOT NULL,
ALTER COLUMN "correlation_id" DROP NOT NULL;

-- DropEnum
DROP TYPE "ActivityActorType";
