import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const file = await prisma.file.findUnique({ where: { id: params.id } });
    if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(file);
  } catch (e) {
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
    const updated = await prisma.file.update({
      where: { id: params.id },
      data: { document: document as any, whiteboard: whiteboard as any, fileName, archived },
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
    await prisma.file.delete({ where: { id: params.id } });
    return NextResponse.json({ status: "deleted" });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
