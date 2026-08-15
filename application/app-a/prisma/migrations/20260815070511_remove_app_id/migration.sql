/*
  Warnings:

  - You are about to drop the column `application_id` on the `local_sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "local_sessions" DROP COLUMN "application_id";

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "relation_id" UUID NOT NULL,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);
