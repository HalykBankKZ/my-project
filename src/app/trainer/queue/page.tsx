"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Submission {
  id: string;
  status: string;
  content?: string;
  submittedAt?: string;
  user: { name: string; email: string };
  mission: { title: string; deadline: string; module: { name: string } };
  grade?: { score: number; feedback?: string } | null;
}

const COMMENT_TEMPLATES = [
  "Отличная работа! Всё верно.",
  "Хорошо, но нужно доработать теоретическую часть.",
  "Обратите внимание на точность формулировок.",
  "Требуется переработка — см. комментарии.",
  "Задание выполнено в полном объёме.",
];

function slaStatus(submittedAt?: string) {
  if (!submittedAt) return null;
  const diff = Date.now() - new Date(submittedAt).getTime();
  const days = Math.floor(diff / 86400000);
  const isOverdue = days >= 3;
  return { days, isOverdue };
}

function GradeModal({
  sub,
  onClose,
  onSuccess,
}: {
  sub: Submission;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [score, setScore] = useState(80);
  const [feedback, setFeedback] = useState("");
  const [needsRework, setNeedsRework] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    await fetch("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: sub.id, score, feedback, needsRework }),
    });
    setLoading(false);
    onSuccess();
    onClose();
  }

  const sla = slaStatus(sub.submittedAt);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-semibold text-lg">{sub.mission.title}</h2>
            <p className="text-sm text-gray-500">{sub.user.name}</p>
          </div>
          {sla && (
            <span className={`text-xs px-2 py-1 rounded-full ${sla.isOverdue ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
              {sla.isOverdue ? `SLA: ${sla.days}д ⚠️` : `${sla.days}д`}
            </span>
          )}
        </div>

        {sub.content && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700 max-h-32 overflow-y-auto">
            {sub.content}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Балл: <strong>{score}</strong>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={score}
            onChange={(e) => setScore(+e.target.value)}
            className="w-full accent-indigo-600"
            disabled={needsRework}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0</span><span>50</span><span>100</span>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Комментарий</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {COMMENT_TEMPLATES.map((t) => (
              <button
                key={t}
                onClick={() => setFeedback(t)}
                className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-600"
              >
                {t.slice(0, 25)}…
              </button>
            ))}
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Ваш комментарий..."
          />
        </div>

        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={needsRework}
            onChange={(e) => setNeedsRework(e.target.checked)}
            className="rounded accent-red-500"
          />
          <span className="text-sm text-red-600 font-medium">Отправить на доработку</span>
        </label>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border rounded-lg text-gray-600">
            Отмена
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-white disabled:opacity-60 ${
              needsRework ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "..." : needsRework ? "На доработку" : "Выставить оценку"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QueuePage() {
  const { status } = useSession();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/grades?schoolId=school-1")
      .then((r) => r.json())
      .then((d) => {
        setSubs(Array.isArray(d) ? d.filter((s: Submission) => !s.grade) : []);
        setLoading(false);
      });
  }

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status]);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Очередь проверки</h1>
        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
          {subs.length} работ
        </span>
      </div>

      {subs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <p className="text-4xl mb-2">✅</p>
          <p className="text-lg font-medium">Очередь пуста</p>
          <p className="text-sm mt-1">Все работы проверены!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subs.map((sub) => {
            const sla = slaStatus(sub.submittedAt);
            return (
              <div key={sub.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        sub.status === "resubmitted"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {sub.status === "resubmitted" ? "Пересдача" : "Новая"}
                      </span>
                      {sla?.isOverdue && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                          ⚠️ SLA просрочено
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900">{sub.mission.title}</p>
                    <p className="text-sm text-gray-500">{sub.user.name} · {sub.mission.module.name}</p>
                    {sub.content && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{sub.content}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("ru") : "—"}
                    </p>
                    <button
                      onClick={() => setSelected(sub)}
                      className="mt-2 text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium"
                    >
                      Проверить
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <GradeModal sub={selected} onClose={() => setSelected(null)} onSuccess={load} />
      )}
    </div>
  );
}
