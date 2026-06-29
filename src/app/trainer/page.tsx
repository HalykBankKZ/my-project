"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Stats {
  pending: number;
  overdue: number;
  total: number;
  avgScore: number;
}

export default function TrainerDashboard() {
  const { status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/grades?schoolId=school-1")
        .then((r) => r.json())
        .then((subs: { status: string; mission: { deadline: string }; grade?: { score: number } | null }[]) => {
          const pending = subs.filter((s) => s.status === "submitted" || s.status === "resubmitted").length;
          const overdue = subs.filter((s) => {
            const isWaiting = s.status === "submitted" || s.status === "resubmitted";
            const slaMs = 3 * 24 * 60 * 60 * 1000;
            return isWaiting && new Date(s.mission.deadline).getTime() + slaMs < Date.now();
          }).length;
          const graded = subs.filter((s) => s.grade);
          const avgScore = graded.length > 0
            ? graded.reduce((sum, s) => sum + (s.grade?.score ?? 0), 0) / graded.length
            : 0;
          setStats({ pending, overdue, total: subs.length, avgScore: Math.round(avgScore) });
        });
    }
  }, [status]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Дашборд тренера</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-3xl font-bold text-indigo-600">{stats?.pending ?? "—"}</p>
          <p className="text-sm text-gray-500 mt-1">Ожидают проверки</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <p className="text-3xl font-bold text-red-500">{stats?.overdue ?? "—"}</p>
          <p className="text-sm text-gray-500 mt-1">Просрочено SLA</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-3xl font-bold text-green-600">{stats?.avgScore ?? "—"}</p>
          <p className="text-sm text-gray-500 mt-1">Средний балл</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-3xl font-bold text-gray-700">{stats?.total ?? "—"}</p>
          <p className="text-sm text-gray-500 mt-1">Всего работ</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-2">Активная школа</h2>
        <p className="text-gray-600">🏫 Школа Кассиров <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Активна</span></p>
        <div className="mt-4">
          <a href="/trainer/queue" className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition">
            Открыть очередь проверки →
          </a>
        </div>
      </div>
    </div>
  );
}
