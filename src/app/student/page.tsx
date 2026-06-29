"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getLevelFromXP } from "@/lib/xp";

interface ProfileData {
  name: string;
  totalXP: number;
  levelInfo: ReturnType<typeof getLevelFromXP>;
  streaks: { courseName: string; current: number; best: number }[];
  ranking: { percentile: number; position: number } | null;
  medals: { key: string; name: string; emoji: string }[];
  avgScore: number | null;
  totalSubmissions: number;
}

function XPBar({ current, next }: { current: number; next: number | null }) {
  if (!next) return null;
  const pct = Math.min(100, Math.round((current / next) * 100));
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{current} XP</span>
        <span>{next} XP</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function StudentHome() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/profile").then((r) => r.json()).then(setProfile);
    }
  }, [status]);

  if (status === "loading" || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const streak = profile.streaks[0];
  const nextMedal = ["🥉", "🥈", "🔥", "🎯"][profile.medals.length] ?? "🏆";

  return (
    <div className="px-4 pt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl font-bold text-indigo-600">
          {profile.name.charAt(0)}
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">Привет, {profile.name.split(" ")[0]}! 👋</h1>
          <p className="text-sm text-gray-500">
            {profile.levelInfo.emoji} {profile.levelInfo.tier} · Уровень {profile.levelInfo.level}
          </p>
        </div>
      </div>

      {/* XP Card */}
      <div className="bg-indigo-600 text-white rounded-2xl p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-indigo-200 text-sm">Опыт (XP)</p>
            <p className="text-3xl font-bold">{profile.totalXP.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-sm">Уровень</p>
            <p className="text-3xl font-bold">{profile.levelInfo.level}</p>
          </div>
        </div>
        <XPBar current={profile.totalXP} next={profile.levelInfo.nextLevelXP} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-orange-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-orange-500">
            🔥 {streak?.current ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">Серия недель</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {profile.ranking ? `Топ ${100 - profile.ranking.percentile}%` : "—"}
          </div>
          <div className="text-xs text-gray-500 mt-1">Рейтинг</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-600">
            {profile.avgScore ? Math.round(profile.avgScore) : "—"}
          </div>
          <div className="text-xs text-gray-500 mt-1">Средний балл</div>
        </div>
      </div>

      {/* Today section */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Сегодня</h2>
        <div className="space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div className="flex-1">
              <p className="font-medium text-gray-800">Открытые задания</p>
              <p className="text-sm text-gray-500">Проверь свои миссии</p>
            </div>
            <a href="/student/missions" className="text-blue-600 text-sm font-medium">
              Открыть →
            </a>
          </div>

          {profile.medals.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">{nextMedal}</span>
              <div>
                <p className="font-medium text-gray-800">Первая медаль близко!</p>
                <p className="text-sm text-gray-500">Сдай первое задание</p>
              </div>
            </div>
          )}

          {profile.medals.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">{profile.medals[0].emoji}</span>
              <div>
                <p className="font-medium text-gray-800">{profile.medals[0].name}</p>
                <p className="text-sm text-gray-500">Последняя медаль</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Medals preview */}
      {profile.medals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800">Медали</h2>
            <a href="/student/medals" className="text-sm text-indigo-600">Все →</a>
          </div>
          <div className="flex gap-2">
            {profile.medals.slice(0, 6).map((m) => (
              <span key={m.key} className="text-2xl" title={m.name}>{m.emoji}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
