-- AlterTable: Add new columns to workspaces table
ALTER TABLE "workspaces" ADD COLUMN "document" JSONB;
ALTER TABLE "workspaces" ADD COLUMN "whiteboard" JSONB;
ALTER TABLE "workspaces" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: Add index for archived column
CREATE INDEX "workspaces_archived_idx" ON "workspaces"("archived");
