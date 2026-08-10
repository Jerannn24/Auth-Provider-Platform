/*
  Warnings:

  - The `status` column on the `access_tokens` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `code_challenge` to the `authorization_codes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "access_tokens" DROP COLUMN "status",
ADD COLUMN     "status" "SSOStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "authorization_codes" ADD COLUMN     "code_challenge" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sso_sessions" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
