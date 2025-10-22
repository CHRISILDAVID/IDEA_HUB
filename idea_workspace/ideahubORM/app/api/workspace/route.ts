import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, ideaId, userId } = body as { name?: string; ideaId: string; userId: string };
    
    if (!ideaId || !userId) {
      return NextResponse.json({ error: "ideaId and userId are required" }, { status: 400 });
    }
    
    const workspace = await prisma.workspace.create({
      data: { 
        name: name || "Untitled",
        ideaId,
        userId,
        document: {},
        whiteboard: { elements: [], appState: {} }
      },
    });
    return NextResponse.json(workspace);
  } catch (e) {
    console.error("Failed to create workspace:", e);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    const where = userId ? { userId } : {};
    const workspaces = await prisma.workspace.findMany({ 
      where,
      orderBy: { createdAt: "desc" },
      include: {
        idea: {
          include: {
            author: true,
          }
        }
      }
    });
    return NextResponse.json(workspaces);
  } catch (e) {
    console.error("Failed to list workspaces:", e);
    return NextResponse.json({ error: "Failed to list" }, { status: 500 });
  }
}
