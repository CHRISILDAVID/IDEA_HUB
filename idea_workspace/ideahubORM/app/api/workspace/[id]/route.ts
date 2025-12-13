import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/workspace/[id]
 * Fetches a single workspace by ID
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const workspace = await prisma.workspace.findUnique({ 
      where: { id: params.id } 
    });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }
    return NextResponse.json(workspace);
  } catch (e) {
    console.error("Failed to fetch workspace:", e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

/**
 * PATCH /api/workspace/[id]
 * Updates workspace document/whiteboard content
 * This is the primary endpoint for saving editor changes
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { document, whiteboard, name, archived, thumbnail } = body as {
      document?: unknown;
      whiteboard?: unknown;
      name?: string;
      archived?: boolean;
      thumbnail?: string;
    };
    
    // Build update data only with provided fields
    const updateData: any = {};
    if (document !== undefined) updateData.document = document;
    if (whiteboard !== undefined) updateData.whiteboard = whiteboard;
    if (name !== undefined) updateData.name = name;
    if (archived !== undefined) updateData.archived = archived;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    
    const updated = await prisma.workspace.update({
      where: { id: params.id },
      data: updateData,
    });
    console.log("Workspace update successful:", updated.id);
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Workspace update failed:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

/**
 * DELETE /api/workspace/[id]
 * Deletes a workspace (cascades from idea deletion in main app)
 * Direct deletion should be restricted in production
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.workspace.delete({ where: { id: params.id } });
    return NextResponse.json({ status: "deleted" });
  } catch (e) {
    console.error("Failed to delete workspace:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
