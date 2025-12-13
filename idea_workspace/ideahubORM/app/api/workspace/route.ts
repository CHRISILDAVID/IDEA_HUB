import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * POST /api/workspace
 * Creates a new workspace. Note: In the integrated system, workspaces should
 * be created through the main app's ideas-create endpoint (atomic creation).
 * This endpoint is kept for backwards compatibility and testing.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, ideaId, userId, isPublic } = body as { 
      name?: string;
      ideaId?: string;
      userId?: string;
      isPublic?: boolean;
    };
    
    // ideaId and userId are required for proper integration
    if (!ideaId || !userId) {
      return NextResponse.json(
        { error: "ideaId and userId are required" }, 
        { status: 400 }
      );
    }
    
    const workspace = await prisma.workspace.create({
      data: { 
        name: name || "Untitled",
        ideaId,
        userId,
        document: {},
        whiteboard: { elements: [], appState: {} },
        isPublic: isPublic ?? false,
      },
    });
    return NextResponse.json(workspace);
  } catch (e) {
    console.error("Failed to create workspace:", e);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

/**
 * GET /api/workspace
 * Lists all workspaces. In production, this should be filtered by userId.
 */
export async function GET() {
  try {
    const workspaces = await prisma.workspace.findMany({ 
      orderBy: { createdAt: "desc" },
      where: { archived: false },
    });
    return NextResponse.json(workspaces);
  } catch (e) {
    console.error("Failed to list workspaces:", e);
    return NextResponse.json({ error: "Failed to list" }, { status: 500 });
  }
}
