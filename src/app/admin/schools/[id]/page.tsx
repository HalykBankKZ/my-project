"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";

const ROLES = [
  { value: "student", label: "Студент" },
  { value: "teacher", label: "Тренер" },
  { value: "admin", label: "Админ" },
];

const ROLE_BADGE: Record<string, string> = {
  student: "bg-blue-100 text-blue-700",
  teacher: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

const ROLE_LABEL: Record<string, string> = {
  student: "Студент",
  teacher: "Тренер",
  admin: "Админ",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Черновик", color: "bg-gray-100 text-gray-600" },
  active: { label: "Активна", color: "bg-green-100 text-green-700" },
  completed: { label: "Завершена", color: "bg-blue-100 text-blue-700" },
  archived: { label: "Архив", color: "bg-yellow-100 text-yellow-700" },
};

interface Member {
  userId: string;
  role: string;
  user: { id: string; name: string; email: string };
}

interface Mission { id: string; title: string; type: string; deadline: string; _count: { submissions: number } }
interface Module { id: string; name: string; order: number; missions: Mission[] }
interface Course { id: string; name: string; modules: Module[] }
interface School {
  id: string;
  name: string;
  description?: string;
  lifecycleStatus: string;
  memberships: Member[];
  courses: Course[];
}

type Tab = "members" | "content" | "materials";

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [school, setSchool] = useState<School | null>(null);
  const [tab, setTab] = useState<Tab>("members");
  const [loading, setLoading] = useState(true);

  // Members form
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("student");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState("");

  // Material upload
  const [matTitle, setMatTitle] = useState("");
  const [matContent, setMatContent] = useState("");
  const [matTopicId, setMatTopicId] = useState("");
  const [matFile, setMatFile] = useState<File | null>(null);
  const [matLoading, setMatLoading] = useState(false);
  const [matSuccess, setMatSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch(`/api/schools/${id}`)
      .then((r) => r.json())
      .then((d) => { setSchool(d); setLoading(false); });
  }

  useEffect(() => { if (id) load(); }, [id]);

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");
    setAddLoading(true);
    const res = await fetch(`/api/schools/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: addEmail, role: addRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAddError(data.error ?? "Ошибка");
    } else {
      setAddSuccess(`${data.user.name} добавлен как ${ROLE_LABEL[addRole]}`);
      setAddEmail("");
      load();
    }
    setAddLoading(false);
  }

  async function removeMember(userId: string) {
    if (!confirm("Удалить участника из школы?")) return;
    await fetch(`/api/schools/${id}/members?userId=${userId}`, { method: "DELETE" });
    load();
  }

  async function uploadMaterial(e: React.FormEvent) {
    e.preventDefault();
    if (!matTopicId) { setMatSuccess(""); return; }
    setMatLoading(true);
    setMatSuccess("");
    const fd = new FormData();
    fd.append("title", matTitle);
    fd.append("topicId", matTopicId);
    if (matContent) fd.append("content", matContent);
    if (matFile) fd.append("file", matFile);
    const res = await fetch("/api/materials", { method: "POST", body: fd });
    if (res.ok) {
      setMatSuccess("Материал загружен!");
      setMatTitle("");
      setMatContent("");
      setMatFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
    setMatLoading(false);
  }

  // Collect all topics from courses → modules → missions (via topics)
  const allTopics: { id: string; title: string }[] = [];
  // For now we'll fetch them separately — or show a notice
  // We'll just collect from school courses

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!school) return <p className="text-red-500">Школа не найдена</p>;

  const st = STATUS_LABELS[school.lifecycleStatus];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
          <span className={`text-sm px-2.5 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
        </div>
        {school.description && <p className="text-gray-500">{school.description}</p>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(["members", "content", "materials"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              tab === t
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "members" && "👥 Участники"}
            {t === "content" && "📚 Контент"}
            {t === "materials" && "📎 Материалы"}
          </button>
        ))}
      </div>

      {/* MEMBERS TAB */}
      {tab === "members" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add member form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Добавить участника</h2>
              <form onSubmit={addMember} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email пользователя</label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="user@company.kz"
                  />
                  <p className="text-xs text-gray-400 mt-1">Пользователь должен быть зарегистрирован</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                {addError && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{addError}</p>}
                {addSuccess && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">✓ {addSuccess}</p>}
                <button
                  type="submit"
                  disabled={addLoading}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-60"
                >
                  {addLoading ? "Добавляю..." : "Добавить"}
                </button>
              </form>
            </div>
          </div>

          {/* Members list */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">Участники ({school.memberships.length})</h2>
              </div>
              {school.memberships.length === 0 ? (
                <div className="py-10 text-center text-gray-400">Нет участников</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 font-medium">Имя</th>
                      <th className="text-left px-5 py-3 font-medium">Email</th>
                      <th className="text-left px-5 py-3 font-medium">Роль</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {school.memberships.map((m) => (
                      <tr key={m.userId} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                              {m.user.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{m.user.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500">{m.user.email}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_BADGE[m.role]}`}>
                            {ROLE_LABEL[m.role]}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => removeMember(m.userId)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB */}
      {tab === "content" && (
        <div className="space-y-4">
          {school.courses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
              <p className="text-3xl mb-2">📚</p>
              <p>Нет курсов. Используйте кнопку «Заполнить демо-данными» на главной.</p>
            </div>
          ) : (
            school.courses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">📚 {course.name}</h3>
                </div>
                {course.modules.map((mod) => (
                  <div key={mod.id} className="border-b border-gray-100 last:border-0">
                    <div className="px-5 py-3 bg-indigo-50/50">
                      <p className="text-sm font-medium text-indigo-700">
                        Этап {mod.order}: {mod.name}
                      </p>
                    </div>
                    {mod.missions.length === 0 ? (
                      <p className="px-5 py-3 text-sm text-gray-400">Нет заданий</p>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {mod.missions.map((m) => (
                          <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-800">{m.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {m.type === "hybrid" ? "Гибридное" : m.type === "test_auto" ? "Автотест" : "Ручная проверка"}
                                {" · "}Дедлайн: {new Date(m.deadline).toLocaleDateString("ru")}
                              </p>
                            </div>
                            <span className="text-xs text-gray-400">
                              📥 {m._count.submissions} сдач
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* MATERIALS TAB */}
      {tab === "materials" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Загрузить материал</h2>
            <form onSubmit={uploadMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <input
                  type="text"
                  required
                  value={matTitle}
                  onChange={(e) => setMatTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Инструкция по работе с кассой"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID темы (topicId)</label>
                <input
                  type="text"
                  required
                  value={matTopicId}
                  onChange={(e) => setMatTopicId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="topic-1"
                />
                <p className="text-xs text-gray-400 mt-1">Примеры: topic-1, topic-2</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Текст материала (необязательно)</label>
                <textarea
                  value={matContent}
                  onChange={(e) => setMatContent(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Текст лекции, инструкции..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Файл (PDF, изображение, видео)</label>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition">
                  <span className="text-2xl mb-1">{matFile ? "📄" : "📎"}</span>
                  <span className="text-sm text-gray-500">
                    {matFile ? matFile.name : "Нажмите для выбора файла"}
                  </span>
                  {matFile && (
                    <span className="text-xs text-gray-400 mt-0.5">
                      {(matFile.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.mov"
                    onChange={(e) => setMatFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              {matSuccess && (
                <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">✓ {matSuccess}</p>
              )}

              <button
                type="submit"
                disabled={matLoading}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-60"
              >
                {matLoading ? "Загружаю..." : "Загрузить материал"}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3">📌 Как добавить материал</h3>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Укажите название материала</li>
              <li>Введите ID темы (topicId) — смотрите в базе или спросите у разработчика</li>
              <li>Добавьте текст и/или файл (PDF, картинка, видео)</li>
              <li>Нажмите «Загрузить материал»</li>
            </ol>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                <strong>Темы в демо-данных:</strong><br />
                <code className="font-mono">topic-1</code> — Кассовые операции<br />
                <code className="font-mono">topic-2</code> — Обслуживание клиентов
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
