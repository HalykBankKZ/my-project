import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id, role: { in: ["admin", "teacher"] } },
    select: { schoolId: true },
  });
  const schoolIds = memberships.map((m) => m.schoolId);

  const schools = await prisma.school.findMany({
    where: schoolIds.length > 0 ? { id: { in: schoolIds } } : {},
    include: {
      _count: { select: { memberships: true, cohorts: true } },
      courses: { include: { _count: { select: { modules: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(schools);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await req.json();
  if (!name) return Response.json({ error: "Name required" }, { status: 400 });

  const school = await prisma.school.create({
    data: {
      name,
      description,
      memberships: { create: { userId: session.user.id, role: "admin" } },
    },
  });

  return Response.json(school, { status: 201 });
}
