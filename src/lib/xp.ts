import { prisma } from "./prisma";

export const XP_RULES = {
  SUBMIT_ON_TIME: 20,
  QUALITY_MULTIPLIER: 200,
  EARLY_BONUS: 30,
  STREAK_INCREMENT: 10,
  MATERIAL_STUDIED: 5,
  KNOWLEDGE_REVIEW: 15,
  MEDAL_BASE: 50,
};

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, tier: "Новичок", emoji: "🌱" },
  { level: 2, xp: 100, tier: "Новичок", emoji: "🌱" },
  { level: 3, xp: 250, tier: "Новичок", emoji: "🌱" },
  { level: 4, xp: 450, tier: "Новичок", emoji: "🌱" },
  { level: 5, xp: 700, tier: "Новичок", emoji: "🌱" },
  { level: 6, xp: 1000, tier: "Исследователь", emoji: "🌿" },
  { level: 7, xp: 1350, tier: "Исследователь", emoji: "🌿" },
  { level: 8, xp: 1750, tier: "Исследователь", emoji: "🌿" },
  { level: 9, xp: 2200, tier: "Исследователь", emoji: "🌿" },
  { level: 10, xp: 2700, tier: "Исследователь", emoji: "🌿" },
  { level: 11, xp: 3250, tier: "Эксперт", emoji: "🔥" },
  { level: 18, xp: 8000, tier: "Эксперт", emoji: "🔥" },
  { level: 19, xp: 9000, tier: "Наставник", emoji: "⭐" },
  { level: 28, xp: 20000, tier: "Наставник", emoji: "⭐" },
  { level: 29, xp: 22000, tier: "Мастер", emoji: "💎" },
  { level: 40, xp: 40000, tier: "Мастер", emoji: "💎" },
  { level: 41, xp: 42000, tier: "Легенда", emoji: "👑" },
];

export function getLevelFromXP(totalXP: number) {
  let result = LEVEL_THRESHOLDS[0];
  for (const entry of LEVEL_THRESHOLDS) {
    if (totalXP >= entry.xp) result = entry;
    else break;
  }
  const nextIdx = LEVEL_THRESHOLDS.indexOf(result) + 1;
  const next = LEVEL_THRESHOLDS[nextIdx];
  return {
    level: result.level,
    tier: result.tier,
    emoji: result.emoji,
    currentLevelXP: result.xp,
    nextLevelXP: next?.xp ?? null,
  };
}

export async function awardXP(
  userId: string,
  schoolId: string,
  amount: number,
  reason: string,
  sourceRef?: string
) {
  return prisma.xPLedger.create({
    data: { userId, schoolId, amount, reason, sourceRef },
  });
}

export async function getTotalXP(userId: string, schoolId: string) {
  const agg = await prisma.xPLedger.aggregate({
    where: { userId, schoolId },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}
