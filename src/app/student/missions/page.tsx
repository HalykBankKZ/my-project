"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Status =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "needs_rework"
  | "resubmitted"
  | "graded";

interface Mission {
  id: string;
  title: string;
  type: string;
  deadline: string;
  module: { name: string };
  submissions: { status: Status; grade?: { score: number; feedback?: string } | null }[];
}

const STATUS_LABEL: Record<Status, { label: string; color: string }> = {
  not_started: { label: "Не начато", color: "text-gray-500 bg-gray-100" },
  in_progress: { label: "В процессе", color: "text-blue-600 bg-blue-100" },
  submitted: { label: "Сдано", color: "text-green-600 bg-green-100" },
  under_review: { label: "На проверке", color: "text-yellow-600 bg-yellow-100" },
  needs_rework: { label: "Нужна доработка", color: "text-red-600 bg-red-100" },
  resubmitted: { label: "Пересдано", color: "text-blue-600 bg-blue-100" },
  graded: { label: "Проверено", color: "text-indigo-600 bg-indigo-100" },
};

function timeLeft(deadline: string) {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return "Просрочено";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days} д ${hours} ч`;
  return `${hours} ч`;
}

function SubmitModal({
  mission,
  onClose,
  onSuccess,
}: {
  mission: Mission;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId: mission.id, content }),
    });
    setLoading(false);
    onSuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end z-50" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto bg-white rounded-t-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-semibold text-lg mb-1">{mission.title}</h2>
        <p className="text-sm text-gray-500 mb-4">Дедлайн: {new Date(mission.deadline).toLocaleDateString("ru")}</p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded-lg p-3 h-32 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Напишите ваш ответ..."
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 border rounded-lg text-gray-600">
            Отмена
          </button>
          <button
            onClick={submit}
            disabled={loading || !content.trim()}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold disabled:opacity-60"
          >
            {loading ? "Отправка..." : "Сдать"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const { status } = useSession();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selected, setSelected] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/missions?schoolId=school-1")
      .then((r) => r.json())
      .then((d) => { setMissions(Array.isArray(d) ? d : []); setLoading(false); });
  }

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status]);

  const grouped: Record<string, Mission[]> = {};
  for (const m of missions) {
    const mod = m.module.name;
    if (!grouped[mod]) grouped[mod] = [];
    grouped[mod].push(m);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Миссии</h1>

      {Object.entries(grouped).map(([mod, items]) => (
        <div key={mod} className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{mod}</h2>
          <div className="space-y-3">
            {items.map((m) => {
              const sub = m.submissions[0];
              const statusKey: Status = sub?.status ?? "not_started";
              const { label, color } = STATUS_LABEL[statusKey];
              const overdue = new Date(m.deadline) < new Date() && statusKey === "not_started";
              const canSubmit = !sub || statusKey === "needs_rework";

              return (
                <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{m.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {m.type === "hybrid" ? "Гибридное" : m.type === "test_auto" ? "Тест" : "Ручная проверка"}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${color}`}>{label}</span>
                  </div>

                  {sub?.grade && (
                    <div className="mt-2 p-2 bg-indigo-50 rounded-lg">
                      <p className="text-sm font-medium text-indigo-700">Оценка: {sub.grade.score}/100</p>
                      {sub.grade.feedback && <p className="text-xs text-gray-600 mt-1">{sub.grade.feedback}</p>}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs ${overdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                      ⏰ {overdue ? "Просрочено" : timeLeft(m.deadline)}
                    </span>
                    {canSubmit && (
                      <button
                        onClick={() => setSelected(m)}
                        className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium"
                      >
                        {statusKey === "needs_rework" ? "Доработать" : "Сдать"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {missions.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📭</p>
          <p>Нет доступных миссий</p>
        </div>
      )}

      {selected && (
        <SubmitModal mission={selected} onClose={() => setSelected(null)} onSuccess={load} />
      )}
    </div>
  );
}
