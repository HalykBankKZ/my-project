import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXP, XP_RULES } from "@/lib/xp";
import { awardMedalIfNew } from "@/lib/medals";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { missionId, content, autoScore } = await req.json();
  const userId = session.user.id;

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    include: { module: { include: { course: { include: { school: true } } } } },
  });
  if (!mission) return Response.json({ error: "Mission not found" }, { status: 404 });

  const now = new Date();
  const onTime = now <= mission.deadline;

  const existing = await prisma.submission.findUnique({
    where: { userId_missionId: { userId, missionId } },
  });

  let submission;
  if (existing && existing.status === "needs_rework") {
    submission = await prisma.submission.update({
      where: { id: existing.id },
      data: { content, status: "resubmitted", submittedAt: now },
    });
  } else {
    submission = await prisma.submission.upsert({
      where: { userId_missionId: { userId, missionId } },
      update: { content, status: "submitted", submittedAt: now, autoScore },
      create: { userId, missionId, content, status: "submitted", submittedAt: now, autoScore },
    });
  }

  const schoolId = mission.module.course.schoolId;

  // Award XP for on-time submission
  if (onTime) {
    await awardXP(userId, schoolId, XP_RULES.SUBMIT_ON_TIME, "on_time_submission", submission.id);

    // Update streak
    await updateStreak(userId, mission.module.courseId, schoolId);

    // First submission medal
    const totalSubs = await prisma.submission.count({ where: { userId, status: { not: "not_started" } } });
    if (totalSubs === 1) {
      await awardMedalIfNew(userId, schoolId, "first_submission");
    }

    // 5 on-time in a row
    const recentOnTime = await prisma.submission.count({
      where: { userId, status: { in: ["submitted", "graded"] }, submittedAt: { not: null } },
    });
    if (recentOnTime >= 5) {
      await awardMedalIfNew(userId, schoolId, "five_on_time");
    }
  }

  return Response.json(submission, { status: 201 });
}

async function updateStreak(userId: string, courseId: string, schoolId: string) {
  const streak = await prisma.streak.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (!streak) {
    await prisma.streak.create({
      data: { userId, courseId, current: 1, best: 1, lastEventDate: new Date() },
    });
    await awardXP(userId, schoolId, XP_RULES.STREAK_INCREMENT, "streak", `${courseId}`);
    return;
  }

  const newCurrent = streak.current + 1;
  const newBest = Math.max(streak.best, newCurrent);
  await prisma.streak.update({
    where: { id: streak.id },
    data: { current: newCurrent, best: newBest, lastEventDate: new Date() },
  });
  await awardXP(userId, schoolId, XP_RULES.STREAK_INCREMENT, "streak_increment", courseId);

  if (newCurrent >= 7) {
    await awardMedalIfNew(userId, schoolId, "streak_7");
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const missionId = searchParams.get("missionId");

  const where = missionId
    ? { missionId }
    : { userId: session.user.id };

  const submissions = await prisma.submission.findMany({
    where,
    include: { grade: true, mission: true, user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { submittedAt: "desc" },
  });

  return Response.json(submissions);
}
