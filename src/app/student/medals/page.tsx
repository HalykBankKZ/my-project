"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MEDAL_DEFINITIONS } from "@/lib/medal-definitions";

interface EarnedMedal {
  key: string;
  name: string;
  emoji: string;
  description: string;
  earnedAt: string;
}

export default function MedalsPage() {
  const { status } = useSession();
  const [earned, setEarned] = useState<EarnedMedal[]>([]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((d) => setEarned(d.medals ?? []));
    }
  }, [status]);

  const earnedKeys = new Set(earned.map((m) => m.key));

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Коллекция медалей</h1>
      <p className="text-sm text-gray-500 mb-6">{earned.length} из {MEDAL_DEFINITIONS.length} получено</p>

      {/* Progress */}
      <div className="mb-5">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all"
            style={{ width: `${(earned.length / MEDAL_DEFINITIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Earned */}
      {earned.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Заработано</h2>
          <div className="space-y-2">
            {earned.map((m) => (
              <div key={m.key} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-4">
                <span className="text-3xl">{m.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{m.name}</p>
                  <p className="text-sm text-gray-500">{m.description}</p>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(m.earnedAt).toLocaleDateString("ru")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ещё не заработано</h2>
        <div className="space-y-2">
          {MEDAL_DEFINITIONS.filter((d) => !earnedKeys.has(d.key)).map((d) => (
            <div key={d.key} className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4 opacity-60">
              <span className="text-3xl grayscale">{d.emoji}</span>
              <div>
                <p className="font-semibold text-gray-700">{d.name}</p>
                <p className="text-sm text-gray-400">{d.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
