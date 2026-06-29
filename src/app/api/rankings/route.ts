import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTotalXP } from "@/lib/xp";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");
  const scope = searchParams.get("scope") ?? "school";

  if (!schoolId) return Response.json({ error: "schoolId required" }, { status: 400 });

  const memberships = await prisma.membership.findMany({
    where: { schoolId, role: "student" },
    include: { user: true },
  });

  const scores = await Promise.all(
    memberships.map(async (m) => {
      const xp = await getTotalXP(m.userId, schoolId);
      const gradedSubs = await prisma.submission.findMany({
        where: { userId: m.userId, status: "graded" },
        include: { grade: true },
      });
      const avgScore =
        gradedSubs.length > 0
          ? gradedSubs.reduce((s, sub) => s + (sub.grade?.score ?? 0), 0) / gradedSubs.length
          : 0;
      const totalMissions = await prisma.mission.count({
        where: { module: { course: { schoolId } } },
      });
      const completedMissions = await prisma.submission.count({
        where: { userId: m.userId, status: "graded" },
      });
      const completionRate = totalMissions > 0 ? completedMissions / totalMissions : 0;
      const rankScore = avgScore * 0.6 + completionRate * 100 * 0.3 + xp * 0.001 * 0.1;

      return {
        userId: m.userId,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
        xp,
        avgScore,
        completionRate,
        rankScore,
      };
    })
  );

  scores.sort((a, b) => b.rankScore - a.rankScore);

  const total = scores.length;
  const ranked = scores.map((s, i) => ({
    ...s,
    position: i + 1,
    percentile: total > 1 ? Math.round(((total - i - 1) / (total - 1)) * 100) : 100,
  }));

  // Current user's position
  const myEntry = ranked.find((r) => r.userId === session.user.id);

  return Response.json({
    rankings: ranked.slice(0, 50),
    myRanking: myEntry,
    total,
    scope,
  });
}
