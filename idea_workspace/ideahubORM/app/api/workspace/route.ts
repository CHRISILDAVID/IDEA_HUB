import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileName } = body as { fileName?: string };
    const file = await prisma.file.create({
      data: { fileName: fileName || "Untitled" },
    });
    return NextResponse.json(file);
  } catch (e) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const files = await prisma.file.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(files);
  } catch (e) {
    return NextResponse.json({ error: "Failed to list" }, { status: 500 });
  }
}
