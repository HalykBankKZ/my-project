import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const title = formData.get("title") as string;
  const topicId = formData.get("topicId") as string;
  const content = formData.get("content") as string | null;
  const file = formData.get("file") as File | null;

  if (!title || !topicId) return Response.json({ error: "title and topicId required" }, { status: 400 });

  let fileUrl: string | undefined;

  if (file && file.size > 0) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || "";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer);
    fileUrl = `/uploads/${filename}`;
  }

  const material = await prisma.material.create({
    data: {
      title,
      topicId,
      content: content || null,
      url: fileUrl,
    },
  });

  return Response.json(material, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const topicId = searchParams.get("topicId");

  const materials = await prisma.material.findMany({
    where: topicId ? { topicId } : {},
    include: { topic: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(materials);
}
