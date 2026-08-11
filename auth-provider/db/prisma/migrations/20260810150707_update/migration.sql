/*
  Warnings:

  - A unique constraint covering the columns `[client_secret_hash]` on the table `applications` will be added. If there are existing duplicate values, this will fail.
  - Made the column `client_secret_hash` on table `applications` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "applications" ALTER COLUMN "client_secret_hash" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "applications_client_secret_hash_key" ON "applications"("client_secret_hash");
