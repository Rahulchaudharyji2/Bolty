/*
  Warnings:

  - You are about to drop the column `type` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `Action` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Prompt` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Action" DROP CONSTRAINT "Action_promptId_fkey";

-- DropForeignKey
ALTER TABLE "Prompt" DROP CONSTRAINT "Prompt_ProjectId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "type",
DROP COLUMN "userId";

-- DropTable
DROP TABLE "Action";

-- DropTable
DROP TABLE "Prompt";

-- DropEnum
DROP TYPE "ProjectType";

-- DropEnum
DROP TYPE "PromptType";
