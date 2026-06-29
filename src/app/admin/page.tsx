"use client";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

export default function AdminPage() {
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function seed() {
    setSeeding(true);
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
    setSeeding(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">🛠️ Панель администратора</h1>
          <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className="text-red-600 text-sm">Выйти</button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="font-semibold mb-3">Демо-данные</h2>
          <p className="text-sm text-gray-500 mb-4">Заполнить базу тестовыми школой, студентами, заданиями и медалями.</p>
          <button
            onClick={seed}
            disabled={seeding}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {seeding ? "Заполняю..." : "Заполнить демо-данными"}
          </button>
          {result && (
            <pre className="mt-4 text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-48">{result}</pre>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-3">Навигация</h2>
          <div className="space-y-2">
            <a href="/student" className="block text-indigo-600 hover:underline">→ Кабинет студента</a>
            <a href="/trainer" className="block text-indigo-600 hover:underline">→ Кабинет тренера</a>
          </div>
        </div>
      </div>
    </div>
  );
}
