import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileName, ideaId, userId } = body as { fileName?: string; ideaId?: string; userId?: string };
    
    // This endpoint is legacy - workspaces should be created via the main app
    // But keep it for backward compatibility
    if (!ideaId || !userId) {
      return NextResponse.json({ error: "ideaId and userId are required" }, { status: 400 });
    }
    
    const workspace = await prisma.workspace.create({
      data: { 
        name: fileName || "Untitled",
        ideaId,
        userId,
        document: {},
        whiteboard: { elements: [], appState: {} },
      },
    });
    
    // Return in expected format
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
    console.error("Failed to create workspace:", e);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const workspaces = await prisma.workspace.findMany({ 
      where: { archived: false },
      orderBy: { createdAt: "desc" },
      include: {
        idea: true,
        owner: true
      }
    });
    
    // Return in expected format
    const formatted = workspaces.map(w => ({
      id: w.id,
      fileName: w.name,
      document: w.document,
      whiteboard: w.whiteboard,
      archived: w.archived,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));
    
    return NextResponse.json(formatted);
  } catch (e) {
    console.error("Failed to list workspaces:", e);
    return NextResponse.json({ error: "Failed to list" }, { status: 500 });
  }
}
