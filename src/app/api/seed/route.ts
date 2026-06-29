import { prisma } from "@/lib/prisma";
import { seedMedalDefinitions } from "@/lib/medals";
import bcrypt from "bcryptjs";

export async function POST() {
  // Seed medal definitions
  await seedMedalDefinitions();

  // Create demo branch
  const branch = await prisma.branch.upsert({
    where: { id: "branch-1" },
    update: {},
    create: { id: "branch-1", name: "Алматы Центр", city: "Алматы" },
  });

  // Create demo school
  const school = await prisma.school.upsert({
    where: { id: "school-1" },
    update: {},
    create: { id: "school-1", name: "Школа Кассиров", lifecycleStatus: "active" },
  });

  // Create demo users
  const adminHash = await bcrypt.hash("admin123", 10);
  const studentHash = await bcrypt.hash("student123", 10);
  const teacherHash = await bcrypt.hash("teacher123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@growvibe.kz" },
    update: {},
    create: { name: "Админ", email: "admin@growvibe.kz", passwordHash: adminHash, branchId: branch.id },
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@growvibe.kz" },
    update: {},
    create: { name: "Айгерим Тренер", email: "teacher@growvibe.kz", passwordHash: teacherHash, branchId: branch.id },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@growvibe.kz" },
    update: {},
    create: { name: "Данияр Студент", email: "student@growvibe.kz", passwordHash: studentHash, branchId: branch.id },
  });

  // Memberships
  await prisma.membership.upsert({
    where: { userId_schoolId: { userId: admin.id, schoolId: school.id } },
    update: {},
    create: { userId: admin.id, schoolId: school.id, role: "admin" },
  });
  await prisma.membership.upsert({
    where: { userId_schoolId: { userId: teacher.id, schoolId: school.id } },
    update: {},
    create: { userId: teacher.id, schoolId: school.id, role: "teacher" },
  });
  await prisma.membership.upsert({
    where: { userId_schoolId: { userId: student.id, schoolId: school.id } },
    update: {},
    create: { userId: student.id, schoolId: school.id, role: "student" },
  });

  // Cohort
  const cohort = await prisma.cohort.upsert({
    where: { id: "cohort-1" },
    update: {},
    create: { id: "cohort-1", name: "Поток 1", schoolId: school.id },
  });

  await prisma.enrollment.upsert({
    where: { userId_cohortId: { userId: student.id, cohortId: cohort.id } },
    update: {},
    create: { userId: student.id, cohortId: cohort.id },
  });

  // Topics
  const topic1 = await prisma.topic.upsert({
    where: { id: "topic-1" },
    update: {},
    create: { id: "topic-1", title: "Кассовые операции", description: "Основы работы с кассой" },
  });
  const topic2 = await prisma.topic.upsert({
    where: { id: "topic-2" },
    update: {},
    create: { id: "topic-2", title: "Обслуживание клиентов", description: "Стандарты сервиса" },
  });

  // Materials
  await prisma.material.upsert({
    where: { id: "mat-1" },
    update: {},
    create: { id: "mat-1", title: "Инструкция по кассовым операциям", topicId: topic1.id, content: "Содержание инструкции..." },
  });
  await prisma.material.upsert({
    where: { id: "mat-2" },
    update: {},
    create: { id: "mat-2", title: "Стандарты обслуживания", topicId: topic2.id, content: "Стандарты сервиса банка..." },
  });

  // Course -> Module -> Mission
  const course = await prisma.course.upsert({
    where: { id: "course-1" },
    update: {},
    create: { id: "course-1", name: "Кассиры", schoolId: school.id },
  });

  const module1 = await prisma.module.upsert({
    where: { id: "module-1" },
    update: {},
    create: { id: "module-1", name: "Этап 1: Основы", order: 1, courseId: course.id },
  });

  const deadline1 = new Date();
  deadline1.setDate(deadline1.getDate() + 7);
  const mission1 = await prisma.mission.upsert({
    where: { id: "mission-1" },
    update: {},
    create: {
      id: "mission-1",
      title: "ДЗ 1: Кассовые операции",
      type: "hybrid",
      deadline: deadline1,
      moduleId: module1.id,
      cohortId: cohort.id,
    },
  });

  await prisma.missionTopic.upsert({
    where: { missionId_topicId: { missionId: mission1.id, topicId: topic1.id } },
    update: {},
    create: { missionId: mission1.id, topicId: topic1.id },
  });

  const deadline2 = new Date();
  deadline2.setDate(deadline2.getDate() + 14);
  const mission2 = await prisma.mission.upsert({
    where: { id: "mission-2" },
    update: {},
    create: {
      id: "mission-2",
      title: "ДЗ 2: Обслуживание клиентов",
      type: "hybrid",
      deadline: deadline2,
      moduleId: module1.id,
      cohortId: cohort.id,
    },
  });

  await prisma.missionTopic.upsert({
    where: { missionId_topicId: { missionId: mission2.id, topicId: topic2.id } },
    update: {},
    create: { missionId: mission2.id, topicId: topic2.id },
  });

  return Response.json({
    message: "Demo data seeded",
    credentials: {
      student: "student@growvibe.kz / student123",
      teacher: "teacher@growvibe.kz / teacher123",
      admin: "admin@growvibe.kz / admin123",
    },
  });
}
