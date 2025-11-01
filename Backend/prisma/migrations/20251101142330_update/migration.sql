-- AlterTable
ALTER TABLE "files" ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "changedLines" JSONB,
ADD COLUMN     "isIncremental" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "files_projectId_path_idx" ON "files"("projectId", "path");
