import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: schoolId } = await params;
  const { email, role } = await req.json();

  if (!email || !role) return Response.json({ error: "email and role required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return Response.json({ error: "Пользователь с таким email не найден" }, { status: 404 });

  const membership = await prisma.membership.upsert({
    where: { userId_schoolId: { userId: user.id, schoolId } },
    update: { role },
    create: { userId: user.id, schoolId, role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return Response.json(membership, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: schoolId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });

  await prisma.membership.deleteMany({ where: { userId, schoolId } });
  return Response.json({ ok: true });
}
