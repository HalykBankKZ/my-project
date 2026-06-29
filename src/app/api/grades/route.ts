import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXP, XP_RULES } from "@/lib/xp";
import { awardMedalIfNew } from "@/lib/medals";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { submissionId, score, feedback, rubric, needsRework } = await req.json();

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      mission: {
        include: { module: { include: { course: { include: { school: true } } } } },
      },
    },
  });
  if (!submission) return Response.json({ error: "Not found" }, { status: 404 });

  const schoolId = submission.mission.module.course.schoolId;

  if (needsRework) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: "needs_rework" },
    });
    return Response.json({ status: "needs_rework" });
  }

  const grade = await prisma.grade.upsert({
    where: { submissionId },
    update: { score, feedback, rubric, gradedById: session.user.id, gradedAt: new Date() },
    create: { submissionId, score, feedback, rubric, gradedById: session.user.id },
  });

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "graded" },
  });

  // Award quality XP
  const qualityXP = Math.round((score / 100) * XP_RULES.QUALITY_MULTIPLIER);
  await awardXP(submission.userId, schoolId, qualityXP, "quality_score", grade.id);

  // Early bonus: submitted >24h before deadline AND score >= 80
  const earlyMs = 24 * 60 * 60 * 1000;
  if (
    submission.submittedAt &&
    submission.mission.deadline.getTime() - submission.submittedAt.getTime() > earlyMs &&
    score >= 80
  ) {
    await awardXP(submission.userId, schoolId, XP_RULES.EARLY_BONUS, "early_bonus", grade.id);
  }

  // Medal checks
  if (score >= 95) {
    await awardMedalIfNew(submission.userId, schoolId, "score_95");
    await awardMedalIfNew(submission.userId, schoolId, "first_excellent");
  } else if (score >= 85) {
    await awardMedalIfNew(submission.userId, schoolId, "first_excellent");
  }

  // Check avg ≥ 90
  const allGrades = await prisma.grade.findMany({
    where: { submission: { userId: submission.userId } },
  });
  if (allGrades.length >= 3) {
    const avg = allGrades.reduce((s: number, g) => s + g.score, 0) / allGrades.length;
    if (avg >= 90) await awardMedalIfNew(submission.userId, schoolId, "avg_90");
  }

  return Response.json(grade, { status: 201 });
}

// Trainer: get pending submissions for review
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const schoolId = searchParams.get("schoolId");

  const submissions = await prisma.submission.findMany({
    where: {
      status: { in: ["submitted", "under_review", "resubmitted"] },
      mission: {
        module: { course: { schoolId: schoolId ?? undefined } },
        type: { in: ["homework_manual", "hybrid"] },
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      mission: { include: { module: { include: { course: true } } } },
      grade: true,
    },
    orderBy: { submittedAt: "asc" },
  });

  return Response.json(submissions);
}
