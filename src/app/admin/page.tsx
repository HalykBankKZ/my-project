"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface School {
  id: string;
  name: string;
  description?: string;
  lifecycleStatus: string;
  _count: { memberships: number };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Черновик", color: "bg-gray-100 text-gray-600" },
  active: { label: "Активна", color: "bg-green-100 text-green-700" },
  completed: { label: "Завершена", color: "bg-blue-100 text-blue-700" },
  archived: { label: "Архив", color: "bg-yellow-100 text-yellow-700" },
};

export default function AdminHome() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schools")
      .then((r) => r.json())
      .then((d) => { setSchools(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const active = schools.filter((s) => s.lifecycleStatus === "active");
  const totalMembers = schools.reduce((s, sc) => s + sc._count.memberships, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Панель администратора</h1>
          <p className="text-gray-500 mt-0.5">Управление школами и пользователями</p>
        </div>
        <Link
          href="/admin/schools"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          + Создать школу
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-3xl font-bold text-gray-900">{schools.length}</p>
          <p className="text-sm text-gray-500 mt-1">Всего школ</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-3xl font-bold text-green-600">{active.length}</p>
          <p className="text-sm text-gray-500 mt-1">Активных школ</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-3xl font-bold text-indigo-600">{totalMembers}</p>
          <p className="text-sm text-gray-500 mt-1">Участников</p>
        </div>
      </div>

      {/* Schools list */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-3">Ваши школы</h2>
        {loading ? (
          <div className="flex items-center justify-center h-32 bg-white rounded-xl border border-gray-200">
            <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : schools.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-4xl mb-3">🏫</p>
            <p className="text-gray-600 font-medium">Нет школ</p>
            <p className="text-gray-400 text-sm mt-1">Создайте первую школу</p>
            <Link
              href="/admin/schools"
              className="mt-4 inline-block bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium"
            >
              Создать школу
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {schools.map((s) => {
              const st = STATUS_LABELS[s.lifecycleStatus];
              return (
                <Link
                  key={s.id}
                  href={`/admin/schools/${s.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:border-indigo-300 hover:shadow-sm transition"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{s.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-sm text-gray-500">{s.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      👥 {s._count.memberships} участников
                    </p>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
