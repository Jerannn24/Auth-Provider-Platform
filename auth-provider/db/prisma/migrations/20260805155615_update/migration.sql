-- AlterTable
ALTER TABLE "applications" ALTER COLUMN "logout_notification_url" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
