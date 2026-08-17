/*
  Warnings:

  - You are about to drop the column `publised_at` on the `events` table. All the data in the column will be lost.
  - Changed the type of `application_id` on the `event_deliveries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "event_deliveries" DROP COLUMN "application_id",
ADD COLUMN     "application_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "events" DROP COLUMN "publised_at",
ADD COLUMN     "published_at" TIMESTAMP(3);
