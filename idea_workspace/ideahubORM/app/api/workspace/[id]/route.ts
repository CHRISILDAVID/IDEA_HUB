import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const workspace = await prisma.workspace.findUnique({ 
      where: { id: params.id },
      include: {
        idea: {
          include: {
            author: true,
            collaborators: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });
    if (!workspace) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(workspace);
  } catch (e) {
    console.error("Failed to fetch workspace:", e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { document, whiteboard, name, archived } = body as {
      document?: unknown;
      whiteboard?: unknown;
      name?: string;
      archived?: boolean;
    };
    const updated = await prisma.workspace.update({
      where: { id: params.id },
      data: { document: document as any, whiteboard: whiteboard as any, name, archived },
    });
    console.log("Update successful:", updated);
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Update failed:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.workspace.delete({ where: { id: params.id } });
    return NextResponse.json({ status: "deleted" });
  } catch (e) {
    console.error("Failed to delete workspace:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
