"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface School {
  id: string;
  name: string;
  description?: string;
  lifecycleStatus: string;
  createdAt: string;
  _count: { memberships: number; cohorts: number };
}

const STATUS_LABELS: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
  draft:     { label: "Черновик", color: "bg-gray-100 text-gray-600",   next: "active",    nextLabel: "Активировать" },
  active:    { label: "Активна",  color: "bg-green-100 text-green-700", next: "completed", nextLabel: "Завершить" },
  completed: { label: "Завершена",color: "bg-blue-100 text-blue-700",   next: "archived",  nextLabel: "В архив" },
  archived:  { label: "Архив",    color: "bg-yellow-100 text-yellow-700" },
};

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [showForm, setShowForm] = useState(false);

  function load() {
    fetch("/api/schools")
      .then((r) => r.json())
      .then((d) => { setSchools(Array.isArray(d) ? d : []); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  async function createSchool(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await fetch("/api/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", description: "" });
    setShowForm(false);
    setCreating(false);
    load();
  }

  async function changeStatus(id: string, status: string) {
    await fetch(`/api/schools/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lifecycleStatus: status }),
    });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Школы</h1>
          <p className="text-gray-500 text-sm mt-0.5">Управление учебными программами</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
        >
          + Создать школу
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Новая школа</h2>
          <form onSubmit={createSchool} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Школа Кассиров"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание (необязательно)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Краткое описание"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {creating ? "Создаю..." : "Создать"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40 bg-white rounded-xl border border-gray-200">
          <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : schools.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-4xl mb-3">🏫</p>
          <p className="text-gray-600 font-medium">Нет школ</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium"
          >
            Создать первую школу
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {schools.map((s) => {
            const st = STATUS_LABELS[s.lifecycleStatus];
            return (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{s.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    {s.description && <p className="text-sm text-gray-500 mb-2">{s.description}</p>}
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span>👥 {s._count.memberships} участников</span>
                      <span>📚 {s._count.cohorts} потоков</span>
                      <span>📅 {new Date(s.createdAt).toLocaleDateString("ru")}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    {st.next && (
                      <button
                        onClick={() => changeStatus(s.id, st.next!)}
                        className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 whitespace-nowrap"
                      >
                        {st.nextLabel}
                      </button>
                    )}
                    <Link
                      href={`/admin/schools/${s.id}`}
                      className="text-sm px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
                    >
                      Открыть →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
