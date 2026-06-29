import { prisma } from "./prisma";
import { awardXP } from "./xp";
import { MEDAL_DEFINITIONS } from "./medal-definitions";

export { MEDAL_DEFINITIONS };

export async function seedMedalDefinitions() {
  for (const medal of MEDAL_DEFINITIONS) {
    await prisma.medalDefinition.upsert({
      where: { key: medal.key },
      update: {},
      create: medal,
    });
  }
}

export async function awardMedalIfNew(
  userId: string,
  schoolId: string,
  medalKey: string
) {
  const def = await prisma.medalDefinition.findUnique({ where: { key: medalKey } });
  if (!def) return null;

  const existing = await prisma.userMedal.findUnique({
    where: { userId_medalDefinitionId: { userId, medalDefinitionId: def.id } },
  });
  if (existing) return null;

  const medal = await prisma.userMedal.create({
    data: { userId, medalDefinitionId: def.id },
  });
  await awardXP(userId, schoolId, def.xpReward, `medal:${medalKey}`, medal.id);
  return medal;
}
