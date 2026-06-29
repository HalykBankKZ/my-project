"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface RankEntry {
  userId: string;
  name: string;
  avatarUrl?: string;
  xp: number;
  avgScore: number;
  rankScore: number;
  position: number;
  percentile: number;
}

interface RankingData {
  rankings: RankEntry[];
  myRanking: RankEntry | null;
  total: number;
}

export default function RankingsPage() {
  const { status } = useSession();
  const [data, setData] = useState<RankingData | null>(null);
  const [scope, setScope] = useState("school");

  useEffect(() => {
    if (status === "authenticated") {
      fetch(`/api/rankings?schoolId=school-1&scope=${scope}`)
        .then((r) => r.json())
        .then(setData);
    }
  }, [status, scope]);

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Рейтинг</h1>

      {/* Scope tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "cohort", label: "Поток" },
          { key: "school", label: "Школа" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setScope(s.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              scope === s.key
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* My position */}
      {data?.myRanking && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-indigo-600 font-medium mb-1">Моё место</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-indigo-700">#{data.myRanking.position}</p>
              <p className="text-sm text-gray-600">из {data.total} участников</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-indigo-600">
                Топ {100 - data.myRanking.percentile + 1}%
              </p>
              <p className="text-xs text-gray-500">{data.myRanking.xp} XP</p>
            </div>
          </div>
          {/* Percentile bar */}
          <div className="mt-3 h-2 bg-indigo-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${data.myRanking.percentile}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Лучше, чем {data.myRanking.percentile}% участников
          </p>
        </div>
      )}

      {/* Top list */}
      {data ? (
        <div className="space-y-2">
          {data.rankings.map((r, i) => (
            <div
              key={r.userId}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                data.myRanking?.userId === r.userId
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="w-8 text-center font-bold text-gray-400">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${r.position}`}
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                {r.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                <p className="text-xs text-gray-400">Ср. балл: {Math.round(r.avgScore)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-indigo-600">{r.xp} XP</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
