import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      memberships: {
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      },
      cohorts: { include: { _count: { select: { enrollments: true } } } },
      courses: {
        include: {
          modules: {
            include: {
              missions: { include: { _count: { select: { submissions: true } } } },
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!school) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(school);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const allowed = ["name", "description", "lifecycleStatus"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const school = await prisma.school.update({ where: { id }, data });
  return Response.json(school);
}
