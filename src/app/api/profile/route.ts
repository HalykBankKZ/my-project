import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTotalXP, getLevelFromXP } from "@/lib/xp";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: { include: { school: true } },
      medals: { include: { medalDefinition: true }, orderBy: { earnedAt: "desc" } },
    },
  });
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  // Get XP for each school
  const schoolIds = user.memberships.map((m) => m.schoolId);
  const xpBySchool: Record<string, number> = {};
  for (const schoolId of schoolIds) {
    xpBySchool[schoolId] = await getTotalXP(userId, schoolId);
  }

  // Total XP across all schools
  const totalXP = Object.values(xpBySchool).reduce((a, b) => a + b, 0);
  const levelInfo = getLevelFromXP(totalXP);

  // Active school ranking
  const activeSchool = user.memberships.find((m) => m.school.lifecycleStatus === "active");
  let ranking = null;
  if (activeSchool) {
    ranking = await prisma.rankingSnapshot.findFirst({
      where: { userId, schoolId: activeSchool.schoolId, scope: "cohort" },
      orderBy: { snapshotAt: "desc" },
    });
  }

  // Streak info
  const streaks = await prisma.streak.findMany({
    where: { userId },
    include: { course: true },
  });

  // Submission stats
  const gradedSubs = await prisma.submission.findMany({
    where: { userId, status: "graded" },
    include: { grade: true },
  });
  const avgScore =
    gradedSubs.length > 0
      ? gradedSubs.reduce((sum, s) => sum + (s.grade?.score ?? 0), 0) / gradedSubs.length
      : null;

  return Response.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    totalXP,
    levelInfo,
    xpBySchool,
    schools: user.memberships.map((m) => ({
      schoolId: m.schoolId,
      schoolName: m.school.name,
      status: m.school.lifecycleStatus,
      role: m.role,
      xp: xpBySchool[m.schoolId],
    })),
    medals: user.medals.map((um) => ({
      key: um.medalDefinition.key,
      name: um.medalDefinition.name,
      emoji: um.medalDefinition.emoji,
      description: um.medalDefinition.description,
      earnedAt: um.earnedAt,
    })),
    streaks: streaks.map((s) => ({
      courseName: s.course.name,
      current: s.current,
      best: s.best,
    })),
    ranking,
    avgScore,
    totalSubmissions: gradedSubs.length,
  });
}
