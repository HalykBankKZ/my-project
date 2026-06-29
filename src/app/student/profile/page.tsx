"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getLevelFromXP } from "@/lib/xp";

interface ProfileData {
  name: string;
  email: string;
  avatarUrl?: string;
  totalXP: number;
  levelInfo: ReturnType<typeof getLevelFromXP>;
  schools: { schoolName: string; status: string; role: string; xp: number }[];
  medals: { key: string; name: string; emoji: string; description: string; earnedAt: string }[];
  streaks: { courseName: string; current: number; best: number }[];
  ranking: { percentile: number; position: number } | null;
  avgScore: number | null;
  totalSubmissions: number;
}

const SCHOOL_STATUS_EMOJI: Record<string, string> = {
  active: "🔄",
  completed: "✔",
  draft: "📝",
  archived: "📦",
};

export default function ProfilePage() {
  const { status } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/profile").then((r) => r.json()).then(setProfile);
    }
  }, [status]);

  if (!profile) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const nextXP = profile.levelInfo.nextLevelXP;
  const pct = nextXP ? Math.min(100, Math.round((profile.totalXP / nextXP) * 100)) : 100;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Avatar & name */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
          {profile.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-sm text-gray-500">{profile.email}</p>
          <p className="text-sm font-medium text-indigo-600 mt-0.5">
            {profile.levelInfo.emoji} {profile.levelInfo.tier} · Уровень {profile.levelInfo.level}
          </p>
        </div>
      </div>

      {/* XP progress */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">{profile.totalXP.toLocaleString()} XP</span>
          {nextXP && <span className="text-gray-400">до ур.{profile.levelInfo.level + 1}: {nextXP.toLocaleString()} XP</span>}
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{profile.avgScore ? Math.round(profile.avgScore) : "—"}</p>
          <p className="text-xs text-gray-500 mt-1">Средний балл</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{profile.totalSubmissions}</p>
          <p className="text-xs text-gray-500 mt-1">Сдано работ</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-orange-500">🔥 {profile.streaks[0]?.current ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Серия (недель)</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-500">🎖️ {profile.medals.length}</p>
          <p className="text-xs text-gray-500 mt-1">Медалей</p>
        </div>
      </div>

      {/* Schools */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-2">Мои школы</h2>
        <div className="space-y-2">
          {profile.schools.map((s) => (
            <div key={s.schoolName} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{SCHOOL_STATUS_EMOJI[s.status] ?? "📚"}</span>
                <span className="font-medium text-gray-800">{s.schoolName}</span>
              </div>
              <div className="text-right">
                <span className="text-sm text-indigo-600 font-medium">{s.xp} XP</span>
                <p className="text-xs text-gray-400">{s.role === "student" ? "Студент" : s.role === "teacher" ? "Тренер" : "Админ"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent medals */}
      {profile.medals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800">Последние медали</h2>
            <a href="/student/medals" className="text-sm text-indigo-600">Все →</a>
          </div>
          <div className="space-y-2">
            {profile.medals.slice(0, 3).map((m) => (
              <div key={m.key} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">{m.emoji}</span>
                <div>
                  <p className="font-medium text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-500">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
