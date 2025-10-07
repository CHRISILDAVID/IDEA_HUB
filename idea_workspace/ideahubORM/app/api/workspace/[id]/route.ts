import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const workspace = await prisma.workspace.findUnique({ 
      where: { id: params.id },
      include: {
        idea: true,
        owner: true
      }
    });
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    // Return workspace data in format expected by the client
    // Map workspace fields to match the old File model interface
    return NextResponse.json({
      id: workspace.id,
      fileName: workspace.name,
      document: workspace.document,
      whiteboard: workspace.whiteboard,
      archived: workspace.archived,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    });
  } catch (e) {
    console.error("Failed to fetch workspace:", e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { document, whiteboard, fileName, archived } = body as {
      document?: unknown;
      whiteboard?: unknown;
      fileName?: string;
      archived?: boolean;
    };
    
    // Build update data object
    const updateData: any = {};
    if (document !== undefined) updateData.document = document as any;
    if (whiteboard !== undefined) updateData.whiteboard = whiteboard as any;
    if (fileName !== undefined) updateData.name = fileName;
    if (archived !== undefined) updateData.archived = archived;
    
    const updated = await prisma.workspace.update({
      where: { id: params.id },
      data: updateData,
    });
    
    console.log("Update successful:", updated);
    
    // Return in expected format
    return NextResponse.json({
      id: updated.id,
      fileName: updated.name,
      document: updated.document,
      whiteboard: updated.whiteboard,
      archived: updated.archived,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (e) {
    console.error("Update failed:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    // Soft delete by setting archived flag
    await prisma.workspace.update({
      where: { id: params.id },
      data: { archived: true }
    });
    return NextResponse.json({ status: "deleted" });
  } catch (e) {
    console.error("Delete failed:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
