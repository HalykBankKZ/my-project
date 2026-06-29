import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");

  // Find active enrollment for this user
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId: session.user.id,
      cohort: { schoolId: schoolId ?? undefined },
    },
    include: { cohort: true },
  });

  const missions = await prisma.mission.findMany({
    where: enrollment
      ? { cohortId: enrollment.cohortId }
      : { module: { course: { schoolId: schoolId ?? undefined } } },
    include: {
      module: { include: { course: true } },
      topics: { include: { topic: true } },
      submissions: {
        where: { userId: session.user.id },
        include: { grade: true },
      },
    },
    orderBy: [{ module: { order: "asc" } }, { deadline: "asc" }],
  });

  return Response.json(missions);
}
